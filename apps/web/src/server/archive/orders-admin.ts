import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { OrderLineRow, OrderRow, ReconciliationRunRow, WebhookEventRow } from "./types";

/** Owner views over the order pipeline. Email addresses never leave as text: hash prefix and domain only. */

export async function listOrdersAdmin(
  limit = 100,
): Promise<(OrderRow & { lines: OrderLineRow[] })[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("provider_orders")
    .select("*, lines:provider_order_lines(*)")
    .order("first_seen_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as (OrderRow & { lines: OrderLineRow[] })[];
}

export async function listWebhookEvents(limit = 50): Promise<WebhookEventRow[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("webhook_events")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as WebhookEventRow[];
}

export async function listReconciliationRuns(limit = 20): Promise<ReconciliationRunRow[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("reconciliation_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ReconciliationRunRow[];
}

export interface OrderCounts {
  total: number;
  byState: Record<string, number>;
  unlinked: number;
  needsReview: number;
  test: number;
  failedEvents: number;
  lastEventAt: string | null;
  lastRunAt: string | null;
}

export async function orderCounts(): Promise<OrderCounts> {
  const empty: OrderCounts = {
    total: 0,
    byState: {},
    unlinked: 0,
    needsReview: 0,
    test: 0,
    failedEvents: 0,
    lastEventAt: null,
    lastRunAt: null,
  };
  if (!supabaseAdmin) return empty;
  const [{ data: orders }, { count: failedEvents }, { data: lastEvent }, { data: lastRun }] =
    await Promise.all([
      supabaseAdmin
        .from("provider_orders")
        .select("payment_state, user_id, needs_review, test_mode"),
      supabaseAdmin
        .from("webhook_events")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
      supabaseAdmin
        .from("webhook_events")
        .select("received_at")
        .order("received_at", { ascending: false })
        .limit(1),
      supabaseAdmin
        .from("reconciliation_runs")
        .select("started_at")
        .order("started_at", { ascending: false })
        .limit(1),
    ]);
  const rows = (orders ?? []) as Pick<
    OrderRow,
    "payment_state" | "user_id" | "needs_review" | "test_mode"
  >[];
  const byState: Record<string, number> = {};
  for (const o of rows) byState[o.payment_state] = (byState[o.payment_state] ?? 0) + 1;
  return {
    total: rows.length,
    byState,
    unlinked: rows.filter((o) => !o.user_id).length,
    needsReview: rows.filter((o) => o.needs_review).length,
    test: rows.filter((o) => o.test_mode).length,
    failedEvents: failedEvents ?? 0,
    lastEventAt: (lastEvent?.[0] as { received_at: string } | undefined)?.received_at ?? null,
    lastRunAt: (lastRun?.[0] as { started_at: string } | undefined)?.started_at ?? null,
  };
}

export interface ProviderAssumptions {
  statuses: Record<string, number>;
  sourceTypes: Record<string, number>;
  apiVersions: string[];
  checkoutMatches: { hit: number; miss: number; none: number };
  quantityKnown: { yes: number; no: number };
  fieldsSeen: string[];
}

/** What the first real orders taught us about Fourthwall's payloads (docs/ARCHIVE.md lists the assumptions). */
export async function providerAssumptions(): Promise<ProviderAssumptions> {
  const empty: ProviderAssumptions = {
    statuses: {},
    sourceTypes: {},
    apiVersions: [],
    checkoutMatches: { hit: 0, miss: 0, none: 0 },
    quantityKnown: { yes: 0, no: 0 },
    fieldsSeen: [],
  };
  if (!supabaseAdmin) return empty;
  const [{ data: orders }, { data: events }] = await Promise.all([
    supabaseAdmin
      .from("provider_orders")
      .select("status_raw, source_type, checkout_id, checkout_session_id"),
    supabaseAdmin
      .from("webhook_events")
      .select("api_version, notes")
      .eq("status", "processed")
      .order("received_at", { ascending: false })
      .limit(100),
  ]);
  const out = {
    ...empty,
    checkoutMatches: { hit: 0, miss: 0, none: 0 },
    quantityKnown: { yes: 0, no: 0 },
  };
  for (const o of (orders ?? []) as Pick<
    OrderRow,
    "status_raw" | "source_type" | "checkout_id" | "checkout_session_id"
  >[]) {
    const s = o.status_raw ?? "(none)";
    out.statuses[s] = (out.statuses[s] ?? 0) + 1;
    const t = o.source_type ?? "(none)";
    out.sourceTypes[t] = (out.sourceTypes[t] ?? 0) + 1;
    if (o.checkout_session_id) out.checkoutMatches.hit++;
    else if (o.checkout_id) out.checkoutMatches.miss++;
    else out.checkoutMatches.none++;
  }
  const versions = new Set<string>();
  const fields = new Set<string>();
  for (const e of (events ?? []) as Pick<WebhookEventRow, "api_version" | "notes">[]) {
    if (e.api_version) versions.add(e.api_version);
    const notes = e.notes as { quantityKnown?: boolean; fieldsSeen?: string[] } | null;
    if (notes?.quantityKnown === true) out.quantityKnown.yes++;
    if (notes?.quantityKnown === false) out.quantityKnown.no++;
    for (const f of notes?.fieldsSeen ?? []) fields.add(f);
  }
  out.apiVersions = [...versions];
  out.fieldsSeen = [...fields].sort();
  return out;
}

export async function listAudit(limit = 100) {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("owner_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
