import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { OrderSummary } from "@/shared";
import { getCatalog } from "../catalog";
import { UserError } from "../errors";
import { audit } from "./audit";
import { listDesigns } from "./designs";
import { getFlags } from "./flags";
import { evaluateFounding } from "./founding";
import { logArchive } from "./log";
import type { ParsedOrder } from "./order-parse";
import { isPartialRefundStatus, paymentState } from "./payment-state";
import type { CheckoutSessionRow, DesignRow, OrderLineRow, OrderRow, ProfileRow } from "./types";

/**
 * Fourthwall's orders as the canonical record on our side: one row per order and line, linked to
 * an account through the checkout session we created, a verified email, a claim or the owner.
 */

function admin() {
  if (!supabaseAdmin) throw new Error("database not configured");
  return supabaseAdmin;
}

export interface CheckoutUser {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
}

/** Called by startCheckout for every cart, signed in or not. Never throws: checkout comes first. */
export async function recordCheckoutSession(input: {
  cartId: string;
  user: CheckoutUser | null | undefined;
  lines: { sku: string; productSlug: string; color: string; size: string; quantity: number }[];
}): Promise<void> {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin.from("checkout_sessions").insert({
    cart_id: input.cartId,
    user_id: input.user?.id ?? null,
    user_email_at_checkout: input.user?.email ?? null,
    email_verified_at_checkout: Boolean(input.user?.email && input.user?.email_confirmed_at),
    lines: input.lines,
  });
  if (error) logArchive("checkout", { event: "session_insert_failed", message: error.message });
}

export interface UpsertResult {
  orderId: string;
  changed: boolean;
  outOfOrder: boolean;
  state: OrderRow["payment_state"];
  linked: OrderRow["link_method"] | null;
  checkoutMatch: "hit" | "miss" | "none";
  unlocked: string[];
  notes: Record<string, unknown>;
}

const lower = (s: string | null | undefined) => s?.trim().toLowerCase() || null;

async function resolveDesign(
  designs: DesignRow[],
  offerId: string | null,
  offerSlug: string | null,
): Promise<DesignRow | null> {
  const byId = offerId ? designs.find((d) => d.fourthwall_offer_id === offerId) : undefined;
  if (byId) return byId;
  const bySlug = offerSlug ? designs.find((d) => d.fourthwall_slug === offerSlug) : undefined;
  if (bySlug && offerId && !bySlug.fourthwall_offer_id) {
    // First sight of this design's offer id: remember it so renamed slugs keep matching.
    const { error } = await admin()
      .from("archive_designs")
      .update({ fourthwall_offer_id: offerId })
      .eq("design_key", bySlug.design_key);
    if (!error) {
      bySlug.fourthwall_offer_id = offerId;
      await audit(null, "design.map_offer", "design", bySlug.design_key, null, {
        offerId,
        from: "order",
      });
    }
  }
  return bySlug ?? null;
}

/** Writes or refreshes an order and its lines from a parsed provider payload, links it and evaluates benefits. */
export async function upsertOrderFromParsed(
  parsed: ParsedOrder,
  opts: { source: "webhook" | "reconcile"; testMode: boolean },
): Promise<UpsertResult> {
  const db = admin();
  const notes: Record<string, unknown> = {};
  const { data: existingData } = await db
    .from("provider_orders")
    .select("*")
    .eq("id", parsed.id)
    .maybeSingle();
  const existing = existingData as OrderRow | null;

  if (
    existing?.provider_updated_at &&
    parsed.updatedAt &&
    new Date(parsed.updatedAt).getTime() < new Date(existing.provider_updated_at).getTime()
  ) {
    return {
      orderId: parsed.id,
      changed: false,
      outOfOrder: true,
      state: existing.payment_state,
      linked: existing.link_method,
      checkoutMatch: "none",
      unlocked: [],
      notes: { outOfOrder: true },
    };
  }

  const state = paymentState(parsed.status);
  const testMode = Boolean(existing?.test_mode) || opts.testMode;
  const now = new Date().toISOString();
  const paidAt = existing?.paid_at ?? (state === "paid" ? (parsed.createdAt ?? now) : null);
  const hasLineRefunds = parsed.lines.some((l) => l.refundedQuantity !== null);
  const partialRefund =
    isPartialRefundStatus(parsed.status) ||
    (parsed.refundedCents > 0 &&
      parsed.totalCents !== null &&
      parsed.refundedCents < parsed.totalCents);
  const needsReview = partialRefund && !hasLineRefunds;

  const row = {
    id: parsed.id,
    friendly_id: parsed.friendlyId,
    checkout_id: parsed.checkoutId,
    email: parsed.email,
    status_raw: parsed.status,
    payment_state: state,
    source_type: parsed.sourceType,
    test_mode: testMode,
    amounts: (parsed.raw as { amounts?: unknown } | null)?.amounts ?? null,
    total_cents: parsed.totalCents,
    refunded_cents: parsed.refundedCents,
    provider_created_at: parsed.createdAt,
    provider_updated_at: parsed.updatedAt,
    paid_at: paidAt,
    raw: parsed.raw ?? {},
    last_event_at: now,
    ...(opts.source === "reconcile" ? { last_reconciled_at: now } : {}),
    ...(needsReview ? { needs_review: true, review_reason: "partial_refund" } : {}),
  };
  const { error } = await db.from("provider_orders").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`order upsert failed: ${error.message}`);

  // Lines
  const designs = await listDesigns();
  const catalog = await getCatalog().catch(() => null);
  const { data: existingLines } = await db
    .from("provider_order_lines")
    .select("*")
    .eq("order_id", parsed.id);
  const previous = new Map(((existingLines ?? []) as OrderLineRow[]).map((l) => [l.id, l]));
  const eligibleBefore = new Set(
    [...previous.values()]
      .filter((l) => l.eligible_quantity > 0 && l.design_key)
      .map((l) => l.design_key!),
  );
  const lines = [];
  let variantUnresolved = false;
  for (const [index, line] of parsed.lines.entries()) {
    const design = await resolveDesign(designs, line.offerId, line.offerSlug);
    const id = `${parsed.id}:${line.offerId ?? "offer"}:${line.variantId ?? index}`;
    const product = design && catalog ? catalog.findBySlug(design.product_slug) : null;
    const variant = product?.variants.find((v) => v.sku === line.variantId);
    const color = variant?.color ?? line.color;
    const size = variant?.size ?? line.size;
    if (!variant && (!line.color || !line.size)) variantUnresolved = true;
    const prev = previous.get(id);
    const refunded = line.refundedQuantity ?? prev?.refunded_quantity ?? 0;
    let eligible: number;
    let lineState: OrderLineRow["line_state"];
    if (state === "revoked") {
      eligible = 0;
      lineState = "cancelled";
    } else if (prev?.line_state === "adjusted") {
      eligible = prev.eligible_quantity;
      lineState = "adjusted";
    } else if (state === "paid") {
      eligible = Math.max(line.quantity - refunded, 0);
      lineState = eligible === 0 && refunded > 0 ? "refunded" : "active";
    } else {
      eligible = 0;
      lineState = "active";
    }
    lines.push({
      id,
      order_id: parsed.id,
      offer_id: line.offerId,
      offer_slug: line.offerSlug,
      offer_name: line.offerName,
      variant_id: line.variantId,
      product_slug: design?.product_slug ?? null,
      design_key: design?.design_key ?? null,
      color,
      size,
      quantity: line.quantity,
      refunded_quantity: refunded,
      eligible_quantity: eligible,
      unit_cents: line.unitCents,
      line_state: lineState,
    });
  }
  if (lines.length > 0) {
    const { error: lineError } = await db
      .from("provider_order_lines")
      .upsert(lines, { onConflict: "id" });
    if (lineError) throw new Error(`order lines upsert failed: ${lineError.message}`);
  }
  if (variantUnresolved) notes.variantUnresolved = true;
  if (lines.some((l) => !l.design_key))
    notes.unmappedLines = lines.filter((l) => !l.design_key).length;
  notes.quantityKnown = parsed.lines.every((l) => l.quantityKnown);
  notes.statusSeen = parsed.status;
  notes.fieldsSeen = parsed.fieldsSeen;

  // Link
  const { data: fresh } = await db.from("provider_orders").select("*").eq("id", parsed.id).single();
  const linkResult = await linkOrder(fresh as OrderRow);
  notes.checkoutMatch = linkResult.checkoutMatch;

  // Benefits
  const unlocked =
    state === "paid" && !testMode && parsed.sourceType === "ORDER" && linkResult.order.user_id
      ? [
          ...new Set(
            lines.filter((l) => l.design_key && l.eligible_quantity > 0).map((l) => l.design_key!),
          ),
        ].filter((k) => !eligibleBefore.has(k))
      : [];
  if (
    state === "paid" &&
    !testMode &&
    parsed.sourceType === "ORDER" &&
    linkResult.order.user_id &&
    (await getFlags())["archive.founding"]
  ) {
    notes.founding = (await evaluateFounding(parsed.id)).reason;
  }
  logArchive("order", {
    order: parsed.id,
    source: opts.source,
    state,
    test: testMode,
    sourceType: parsed.sourceType,
    linked: linkResult.order.link_method,
    checkoutMatch: linkResult.checkoutMatch,
    lines: lines.length,
  });
  return {
    orderId: parsed.id,
    changed: true,
    outOfOrder: false,
    state,
    linked: linkResult.order.link_method,
    checkoutMatch: linkResult.checkoutMatch,
    unlocked,
    notes,
  };
}

/**
 * Linking precedence: an existing link stays; then the checkout session whose cart id the order
 * names (registered evidence when it had a user, guest evidence otherwise); then an account whose
 * verified email equals the order's email (guest provenance); else unlinked.
 */
export async function linkOrder(
  order: OrderRow,
): Promise<{ order: OrderRow; checkoutMatch: "hit" | "miss" | "none" }> {
  const db = admin();
  let checkoutMatch: "hit" | "miss" | "none" = "none";
  const update: Partial<OrderRow> = {};
  if (order.checkout_id && !order.checkout_session_id) {
    const { data } = await db
      .from("checkout_sessions")
      .select("*")
      .eq("cart_id", order.checkout_id)
      .maybeSingle();
    const session = data as CheckoutSessionRow | null;
    checkoutMatch = session ? "hit" : "miss";
    if (session) {
      update.checkout_session_id = session.id;
      update.registered_checkout = Boolean(session.user_id);
      if (session.user_id && !order.user_id) {
        update.user_id = session.user_id;
        update.link_method = "checkout_session";
        update.linked_at = new Date().toISOString();
        if (lower(session.user_email_at_checkout) !== lower(order.email) && !order.needs_review) {
          update.needs_review = true;
          update.review_reason = "email_mismatch";
        }
      }
      await db
        .from("checkout_sessions")
        .update({ matched_order_id: order.id, matched_at: new Date().toISOString() })
        .eq("id", session.id);
    }
    logArchive("link", { order: order.id, checkoutMatch });
  }
  if (!order.user_id && !update.user_id && order.email && !order.test_mode) {
    const { data } = await db
      .from("profiles")
      .select("id, email, full_name, email_verified_at")
      .ilike("email", order.email.trim())
      .not("email_verified_at", "is", null)
      .limit(2);
    const profiles = (data ?? []) as ProfileRow[];
    if (profiles.length === 1) {
      update.user_id = profiles[0]!.id;
      update.link_method = "email_match";
      update.registered_checkout = update.registered_checkout ?? order.registered_checkout ?? false;
      update.linked_at = new Date().toISOString();
    }
  }
  if (Object.keys(update).length === 0) return { order, checkoutMatch };
  const { data, error } = await db
    .from("provider_orders")
    .update(update)
    .eq("id", order.id)
    .select("*")
    .single();
  if (error) throw new Error(`order link failed: ${error.message}`);
  return { order: data as OrderRow, checkoutMatch };
}

/** Links unlinked orders whose email equals the account's verified email: guest provenance, ordinary benefits. */
export async function autoLinkByEmail(user: CheckoutUser): Promise<number> {
  if (!supabaseAdmin || !user.email || !user.email_confirmed_at) return 0;
  const { data, error } = await supabaseAdmin
    .from("provider_orders")
    .update({ user_id: user.id, link_method: "email_match", linked_at: new Date().toISOString() })
    .is("user_id", null)
    .eq("test_mode", false)
    .ilike("email", user.email.trim())
    .select("id, registered_checkout");
  if (error) throw new Error(`auto-link failed: ${error.message}`);
  const linked = (data ?? []) as Pick<OrderRow, "id" | "registered_checkout">[];
  if (linked.length > 0) {
    await supabaseAdmin
      .from("provider_orders")
      .update({ registered_checkout: false })
      .in(
        "id",
        linked.filter((o) => o.registered_checkout === null).map((o) => o.id),
      );
    logArchive("link", { user: user.id, emailMatched: linked.length });
  }
  return linked.length;
}

export async function listOrdersForUser(userId: string): Promise<OrderSummary[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("provider_orders")
    .select("*, lines:provider_order_lines(*)")
    .eq("user_id", userId)
    .order("provider_created_at", { ascending: false, nullsFirst: false });
  const catalog = await getCatalog().catch(() => null);
  return ((data ?? []) as (OrderRow & { lines: OrderLineRow[] })[]).map((o) => ({
    id: o.id,
    friendlyId: o.friendly_id,
    placedAt: o.provider_created_at ?? o.first_seen_at,
    sync:
      o.payment_state === "paid"
        ? "confirmed"
        : o.payment_state === "revoked"
          ? "revoked"
          : "pending",
    lines: o.lines.map((l) => {
      const product = l.product_slug ? catalog?.findBySlug(l.product_slug) : null;
      return {
        slug: l.product_slug,
        name: product?.name || l.offer_name || "Piece",
        cut: product?.category.cut ?? null,
        color: l.color,
        size: l.size,
        quantity: l.quantity,
        image: product?.image.url ?? (l.product_slug ? `/products/${l.product_slug}/1.webp` : null),
      };
    }),
  }));
}

export async function getOrder(
  orderId: string,
): Promise<(OrderRow & { lines: OrderLineRow[] }) | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("provider_orders")
    .select("*, lines:provider_order_lines(*)")
    .eq("id", orderId)
    .maybeSingle();
  return (data as (OrderRow & { lines: OrderLineRow[] }) | null) ?? null;
}

// Owner corrections, audited

export async function adjustOrderLines(
  orderId: string,
  lines: { lineId: string; eligibleQuantity: number }[],
  reason: string,
  actor: string,
) {
  const order = await getOrder(orderId);
  if (!order) throw new UserError("Unknown order.");
  for (const change of lines) {
    const line = order.lines.find((l) => l.id === change.lineId);
    if (!line) throw new UserError("Unknown order line.");
    if (change.eligibleQuantity > line.quantity)
      throw new UserError("Eligible units can’t exceed the units bought.");
    const { error } = await admin()
      .from("provider_order_lines")
      .update({
        eligible_quantity: change.eligibleQuantity,
        line_state: "adjusted",
        adjusted_by: actor,
        adjusted_at: new Date().toISOString(),
      })
      .eq("id", line.id);
    if (error) throw new Error(`line adjust failed: ${error.message}`);
    await audit(
      actor,
      "order.adjust_line",
      "order_line",
      line.id,
      { eligible: line.eligible_quantity },
      { eligible: change.eligibleQuantity },
      reason,
    );
  }
}

export async function relinkOrder(
  orderId: string,
  userId: string | null,
  reason: string,
  actor: string,
) {
  const order = await getOrder(orderId);
  if (!order) throw new UserError("Unknown order.");
  const { error } = await admin()
    .from("provider_orders")
    .update({
      user_id: userId,
      link_method: userId ? "owner" : null,
      linked_at: userId ? new Date().toISOString() : null,
    })
    .eq("id", orderId);
  if (error) throw new Error(`relink failed: ${error.message}`);
  await audit(
    actor,
    "order.relink",
    "order",
    orderId,
    { userId: order.user_id, method: order.link_method },
    { userId, method: userId ? "owner" : null },
    reason,
  );
}

export async function markOrderReviewed(orderId: string, actor: string) {
  const order = await getOrder(orderId);
  if (!order) throw new UserError("Unknown order.");
  const { error } = await admin()
    .from("provider_orders")
    .update({ needs_review: false, review_reason: null })
    .eq("id", orderId);
  if (error) throw new Error(`review update failed: ${error.message}`);
  await audit(actor, "order.reviewed", "order", orderId, { reason: order.review_reason }, null);
}
