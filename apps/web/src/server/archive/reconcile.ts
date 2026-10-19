import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { UserError } from "../errors";
import { settleFounding } from "./founding";
import { getOrder as fetchOrder, listOrders, platformConfigured } from "./fourthwall-platform";
import { logArchive } from "./log";
import { parseOrder } from "./order-parse";
import { upsertOrderFromParsed, type CheckoutUser } from "./orders";
import type { CheckoutSessionRow, OrderRow, ReconciliationRunRow } from "./types";

/**
 * Catches what webhooks missed: re-reads orders that are pending, unknown, under review or stale
 * from the Platform API, and (for the cron and the owner) walks the provider's order list for
 * orders that never arrived. Founding's contested places settle only after a complete walk.
 */
export interface ReconcileReport {
  runId: string;
  checked: number;
  changed: number;
  listedAll: boolean;
  settled: number;
  error: string | null;
}

const STALE_DAYS = 7;
const MAX_PAGES = 10;

export async function reconcileOrders(opts: {
  trigger: "cron" | "owner" | "user";
  userId?: string;
}): Promise<ReconcileReport> {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  if (!platformConfigured()) throw new UserError("Order sync isn’t available yet.");
  const db = supabaseAdmin;
  const { data: runRow, error: runError } = await db
    .from("reconciliation_runs")
    .insert({ trigger: opts.trigger, user_id: opts.userId ?? null })
    .select("*")
    .single();
  if (runError) throw new Error(`run insert failed: ${runError.message}`);
  const run = runRow as ReconciliationRunRow;
  let checked = 0;
  let changed = 0;
  let listedAll = false;
  let settled = 0;
  let error: string | null = null;
  const notes: Record<string, unknown> = {};
  try {
    const stale = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60_000).toISOString();
    let query = db
      .from("provider_orders")
      .select("id, payment_state, needs_review, last_reconciled_at, user_id")
      .or(
        `payment_state.in.(pending,unknown),needs_review.eq.true,last_reconciled_at.is.null,last_reconciled_at.lt.${stale}`,
      )
      .limit(200);
    if (opts.userId) query = query.eq("user_id", opts.userId);
    const { data: targets } = await query;
    for (const t of (targets ?? []) as Pick<OrderRow, "id">[]) {
      const parsed = parseOrder(await fetchOrder(t.id));
      checked++;
      if (!parsed) continue;
      const result = await upsertOrderFromParsed(parsed, { source: "reconcile", testMode: false });
      if (result.changed) changed++;
    }
    if (opts.trigger !== "user") {
      const { data: lastRuns } = await db
        .from("reconciliation_runs")
        .select("cursor")
        .eq("listed_all", true)
        .order("finished_at", { ascending: false })
        .limit(1);
      const cursor = (lastRuns?.[0] as { cursor?: { oldestSeenCreatedAt?: string } } | undefined)
        ?.cursor;
      let newestSeen: string | null = null;
      let reachedKnown = false;
      for (let page = 0; page < MAX_PAGES && !reachedKnown; page++) {
        const { results, hasNextPage } = await listOrders(page, 50);
        for (const item of results) {
          const parsed = parseOrder(item);
          if (!parsed) continue;
          if (!newestSeen || (parsed.createdAt && parsed.createdAt > newestSeen))
            newestSeen = parsed.createdAt;
          if (
            cursor?.oldestSeenCreatedAt &&
            parsed.createdAt &&
            parsed.createdAt < cursor.oldestSeenCreatedAt
          ) {
            reachedKnown = true;
            break;
          }
          const { data: known } = await db
            .from("provider_orders")
            .select("id, provider_updated_at")
            .eq("id", parsed.id)
            .maybeSingle();
          const knownRow = known as Pick<OrderRow, "id" | "provider_updated_at"> | null;
          if (
            !knownRow ||
            (parsed.updatedAt && knownRow.provider_updated_at !== parsed.updatedAt)
          ) {
            checked++;
            const result = await upsertOrderFromParsed(parsed, {
              source: "reconcile",
              testMode: false,
            });
            if (result.changed) changed++;
          }
        }
        if (!hasNextPage) {
          reachedKnown = true;
        }
      }
      listedAll = reachedKnown;
      notes.cursor = { oldestSeenCreatedAt: newestSeen ?? cursor?.oldestSeenCreatedAt ?? null };
      if (listedAll) {
        const outcome = await settleFounding("reconcile");
        settled = outcome.settled;
        if (outcome.skipped) notes.settleSkipped = outcome.skipped;
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    logArchive("reconcile", { run: run.id, error });
  }
  await db
    .from("reconciliation_runs")
    .update({
      finished_at: new Date().toISOString(),
      orders_checked: checked,
      orders_changed: changed,
      listed_all: listedAll && !error,
      cursor: (notes.cursor as object | undefined) ?? null,
      notes,
      error,
    })
    .eq("id", run.id);
  logArchive("reconcile", {
    run: run.id,
    trigger: opts.trigger,
    checked,
    changed,
    listedAll,
    settled,
  });
  return { runId: run.id, checked, changed, listedAll, settled, error };
}

const PULL_DAYS = 3;
const PULL_PAGES = 2;

/**
 * Fourthwall's webhook reaches production only, so elsewhere a just-placed order never arrives on
 * its own. Looks through the newest orders for this account's unfinished recent checkouts (or its
 * verified email) and stores any that are missing, which links them. Returns how many came in.
 */
export async function pullMyMissingOrders(user: CheckoutUser): Promise<number> {
  if (!supabaseAdmin || !platformConfigured()) return 0;
  const db = supabaseAdmin;
  const { data } = await db
    .from("checkout_sessions")
    .select("cart_id, created_at")
    .eq("user_id", user.id)
    .is("matched_order_id", null)
    .gte("created_at", new Date(Date.now() - PULL_DAYS * 24 * 60 * 60_000).toISOString())
    .order("created_at");
  const sessions = (data ?? []) as Pick<CheckoutSessionRow, "cart_id" | "created_at">[];
  if (sessions.length === 0) return 0;
  const carts = new Set(sessions.map((s) => s.cart_id));
  const since = Date.parse(sessions[0]!.created_at);
  const email = user.email_confirmed_at ? user.email?.trim().toLowerCase() : undefined;
  let pulled = 0;
  for (let page = 0; page < PULL_PAGES; page++) {
    const { results, hasNextPage } = await listOrders(page, 50);
    let older = false;
    for (const item of results) {
      const parsed = parseOrder(item);
      if (!parsed) continue;
      if (parsed.createdAt && Date.parse(parsed.createdAt) < since) {
        older = true;
        continue;
      }
      const mine =
        (parsed.checkoutId && carts.has(parsed.checkoutId)) ||
        (email && parsed.email?.trim().toLowerCase() === email);
      if (!mine) continue;
      const { data: known } = await db
        .from("provider_orders")
        .select("id")
        .eq("id", parsed.id)
        .maybeSingle();
      if (known) continue;
      await upsertOrderFromParsed(parsed, { source: "reconcile", testMode: false });
      pulled++;
    }
    if (older || !hasNextPage) break;
  }
  if (pulled > 0) logArchive("reconcile", { trigger: "pull", user: user.id, pulled });
  return pulled;
}
