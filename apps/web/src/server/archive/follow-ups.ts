import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCatalog } from "../catalog";
import { queueEmail } from "./email-outbox";
import { GUEST_ORDER_COLUMNS, opensForGuest, pieceNames, type GuestOrder } from "./guest-orders";
import { getArchiveOffer } from "./offer";
import type { CheckoutSessionRow } from "./types";

/**
 * The daily follow-ups (api/archive/follow-ups, after the reconcile, so an order whose webhook was
 * missed is in): the morning after a paid guest order, one email inviting the buyer into My
 * Archive; a day after a signed-in checkout that wasn't finished, one reminder. Both go through the
 * outbox, so their flags decide whether anything is sent, and its rows keep either from repeating.
 */

const HOUR = 60 * 60_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();
const lower = (email: string | null | undefined) => email?.trim().toLowerCase() ?? "";

/** A failed read must not pass for "nothing sent yet", or an email could go twice. */
function rows<T>(result: { data: unknown; error: { message: string } | null }): T[] {
  if (result.error) throw new Error(`follow-ups read failed: ${result.error.message}`);
  return (result.data ?? []) as T[];
}

/**
 * Guest orders paid 8 to 48 hours ago whose email has no account: one email per address, ever,
 * naming every piece its orders in this window open.
 */
export async function sendGuestFollowUps(): Promise<number> {
  const db = supabaseAdmin;
  if (!db || !(await getArchiveOffer()).orders) return 0;
  const found = await db
    .from("provider_orders")
    .select(GUEST_ORDER_COLUMNS)
    .is("user_id", null)
    .eq("payment_state", "paid")
    .not("email", "is", null)
    .gte("paid_at", ago(48))
    .lt("paid_at", ago(8));
  const orders = rows<GuestOrder>(found).filter(opensForGuest);
  if (orders.length === 0) return 0;
  const emails = [...new Set(orders.map((o) => lower(o.email)))];
  const [recent, sent, accounts] = await Promise.all([
    db
      .from("email_outbox")
      .select("payload")
      .eq("template", "guest_follow_up")
      .gte("created_at", ago(72)),
    db
      .from("email_outbox")
      .select("to_email")
      .eq("template", "guest_follow_up")
      .eq("status", "sent")
      .in("to_email", emails),
    db.from("profiles").select("email").in("email", emails),
  ]);
  const handled = new Set(
    rows<{ payload: { orderIds?: string[] } | null }>(recent).flatMap(
      (r) => r.payload?.orderIds ?? [],
    ),
  );
  const skip = new Set([
    ...rows<{ to_email: string | null }>(sent).map((r) => lower(r.to_email)),
    ...rows<{ email: string | null }>(accounts).map((r) => lower(r.email)),
  ]);
  let queued = 0;
  for (const to of emails) {
    const mine = orders.filter((o) => lower(o.email) === to && !handled.has(o.id));
    if (skip.has(to) || mine.length === 0) continue;
    await queueEmail({
      template: "guest_follow_up",
      userId: null,
      to,
      payload: { orderIds: mine.map((o) => o.id), names: await pieceNames(mine) },
    });
    queued++;
  }
  return queued;
}

type Session = Pick<
  CheckoutSessionRow,
  "cart_id" | "user_id" | "user_email_at_checkout" | "created_at"
> & {
  lines: { productSlug: string }[] | null;
};

/**
 * Signed-in checkouts started 18 to 42 hours ago that no order followed: one reminder for the newest
 * per account, at most once in 30 days, unless the account turned reminders off (the outbox checks).
 */
export async function sendCartReminders(): Promise<number> {
  const db = supabaseAdmin;
  if (!db) return 0;
  const started = await db
    .from("checkout_sessions")
    .select("cart_id, user_id, user_email_at_checkout, created_at, lines")
    .not("user_id", "is", null)
    .is("matched_order_id", null)
    .gte("created_at", ago(42))
    .lt("created_at", ago(18))
    .order("created_at", { ascending: false });
  const newest = new Map<string, Session>();
  for (const s of rows<Session>(started)) if (!newest.has(s.user_id!)) newest.set(s.user_id!, s);
  if (newest.size === 0) return 0;
  const userIds = [...newest.keys()];
  const [orders, reminded, profiles, catalog] = await Promise.all([
    db
      .from("provider_orders")
      .select("user_id, email, first_seen_at")
      .gte("first_seen_at", ago(42)),
    db
      .from("email_outbox")
      .select("user_id")
      .eq("template", "cart_reminder")
      .in("user_id", userIds)
      .gte("created_at", ago(24 * 30)),
    db.from("profiles").select("id, email").in("id", userIds),
    getCatalog().catch(() => null),
  ]);
  const placed = rows<{ user_id: string | null; email: string | null; first_seen_at: string }>(
    orders,
  );
  const already = new Set(rows<{ user_id: string }>(reminded).map((r) => r.user_id));
  const emailOf = new Map(
    rows<{ id: string; email: string | null }>(profiles).map((p) => [p.id, lower(p.email)]),
  );
  let queued = 0;
  for (const [userId, s] of newest) {
    const to = emailOf.get(userId);
    if (!to || already.has(userId)) continue;
    const emails = [to, lower(s.user_email_at_checkout)].filter(Boolean);
    const bought = placed.some(
      (o) =>
        Date.parse(o.first_seen_at) >= Date.parse(s.created_at) &&
        (o.user_id === userId || emails.includes(lower(o.email))),
    );
    if (bought) continue;
    const pieces = [...new Set((s.lines ?? []).map((l) => l.productSlug))].flatMap((slug) => {
      const product = catalog?.findBySlug(slug);
      return product ? [{ name: product.name, slug: product.slug }] : [];
    });
    if (pieces.length === 0) continue;
    await queueEmail({
      template: "cart_reminder",
      userId,
      to,
      payload: { cartId: s.cart_id, pieces },
    });
    queued++;
  }
  return queued;
}
