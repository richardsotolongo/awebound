import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { UserError } from "../errors";
import { audit } from "./audit";
import { getFlags } from "./flags";
import { CANDIDATE_REASONS, FOUNDING_CAP, qualifies } from "./founding-policy";
import { logArchive } from "./log";
import type {
  CandidateReason,
  CandidateRow,
  FoundingRow,
  OrderRow,
  ProfileRow,
  ReconciliationRunRow,
} from "./types";

function admin() {
  if (!supabaseAdmin) throw new Error("database not configured");
  return supabaseAdmin;
}

export interface AwardResult {
  awarded: boolean;
  rank: number | null;
  reason: string;
}

async function award(
  userId: string,
  orderId: string,
  paidAt: string,
  by: "system" | "reconcile" | "owner",
  settled: boolean,
): Promise<AwardResult> {
  const { data, error } = await admin().rpc("archive_award_founding", {
    p_user_id: userId,
    p_order_id: orderId,
    p_paid_at: paidAt,
    p_by: by,
    p_settled: settled,
  });
  if (error) throw new Error(`founding award failed: ${error.message}`);
  const row = (Array.isArray(data) ? data[0] : data) as AwardResult | undefined;
  return row ?? { awarded: false, rank: null, reason: "no_result" };
}

async function recordCandidate(
  userId: string,
  orderId: string,
  paidAt: string,
  reason: CandidateReason,
) {
  const { error } = await admin()
    .from("founding_candidates")
    .upsert(
      { user_id: userId, order_id: orderId, paid_at: paidAt, reason },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(`candidate upsert failed: ${error.message}`);
}

async function loadOrder(
  orderId: string,
): Promise<{ order: OrderRow; profile: ProfileRow | null } | null> {
  const { data } = await admin()
    .from("provider_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  const order = data as OrderRow | null;
  if (!order) return null;
  let profile: ProfileRow | null = null;
  if (order.user_id) {
    const { data: p } = await admin()
      .from("profiles")
      .select("id, email, full_name, email_verified_at")
      .eq("id", order.user_id)
      .maybeSingle();
    profile = (p as ProfileRow | null) ?? null;
  }
  return { order, profile };
}

/** Called when an order becomes paid. Awards a place, or records why the buyer is waiting. */
export async function evaluateFounding(orderId: string): Promise<AwardResult> {
  const loaded = await loadOrder(orderId);
  if (!loaded) return { awarded: false, rank: null, reason: "no_order" };
  const { order, profile } = loaded;
  const q = qualifies(order, profile, (await getFlags())["archive.founding"]);
  if (!q.ok) {
    if (order.user_id && CANDIDATE_REASONS.has(q.reason))
      await recordCandidate(
        order.user_id,
        order.id,
        order.paid_at ?? order.provider_created_at ?? new Date().toISOString(),
        q.reason as CandidateReason,
      );
    logArchive("founding", { order: order.id, result: q.reason });
    return { awarded: false, rank: null, reason: q.reason };
  }
  const result = await award(
    order.user_id!,
    order.id,
    order.paid_at ?? order.provider_created_at ?? new Date().toISOString(),
    "system",
    false,
  );
  logArchive("founding", { order: order.id, result: result.reason, rank: result.rank });
  return result;
}

/** The last places, in payment order, once the provider's order list has been walked recently. */
export async function settleFounding(
  by: "reconcile" | "owner",
  actor?: string,
): Promise<{ settled: number; skipped: string | null }> {
  const { data: runs } = await admin()
    .from("reconciliation_runs")
    .select("*")
    .eq("listed_all", true)
    .is("error", null)
    .order("finished_at", { ascending: false })
    .limit(1);
  const last = (runs?.[0] as ReconciliationRunRow | undefined) ?? null;
  const fresh =
    last?.finished_at && Date.now() - new Date(last.finished_at).getTime() < 24 * 60 * 60_000;
  if (!fresh)
    return {
      settled: 0,
      skipped: "The provider's order list hasn't been checked in the last 24 hours.",
    };
  const { data } = await admin()
    .from("founding_candidates")
    .select("*")
    .eq("reason", "contested_window")
    .order("paid_at", { ascending: true })
    .order("order_id", { ascending: true });
  let settled = 0;
  for (const c of (data ?? []) as CandidateRow[]) {
    const loaded = c.order_id ? await loadOrder(c.order_id) : null;
    if (!loaded) continue;
    const q = qualifies(loaded.order, loaded.profile, true);
    if (!q.ok) {
      if (CANDIDATE_REASONS.has(q.reason))
        await recordCandidate(c.user_id, c.order_id!, c.paid_at, q.reason as CandidateReason);
      else await admin().from("founding_candidates").delete().eq("user_id", c.user_id);
      continue;
    }
    const result = await award(c.user_id, c.order_id!, c.paid_at, by, true);
    if (result.awarded) settled++;
    if (result.reason === "cap_reached") break;
  }
  if (settled > 0)
    await audit(actor ?? null, "founding.settle", "founding", null, null, { settled, by });
  return { settled, skipped: null };
}

export async function getFoundingForUser(userId: string): Promise<{ status: "active" } | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("founding_members")
    .select("status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return data ? { status: "active" } : null;
}

export async function listFounding(): Promise<{
  members: FoundingRow[];
  candidates: CandidateRow[];
  placesUsed: number;
  placesLeft: number;
}> {
  const [{ data: members }, { data: candidates }] = await Promise.all([
    admin().from("founding_members").select("*").order("rank"),
    admin().from("founding_candidates").select("*").order("paid_at"),
  ]);
  const placesUsed = members?.length ?? 0;
  return {
    members: (members ?? []) as FoundingRow[],
    candidates: (candidates ?? []) as CandidateRow[],
    placesUsed,
    placesLeft: Math.max(FOUNDING_CAP - placesUsed, 0),
  };
}

/** Owner corrections, audited: revoke or restore a seal, or award one by hand. */
export async function foundingCorrection(
  userId: string,
  action: "revoke" | "restore" | "award",
  reason: string,
  actor: string,
  orderId?: string,
): Promise<AwardResult | { awarded: boolean; rank: number | null; reason: string }> {
  const { data } = await admin()
    .from("founding_members")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const member = data as FoundingRow | null;
  if (action === "award") {
    if (member) throw new UserError("That account already holds a place.");
    const loaded = orderId ? await loadOrder(orderId) : null;
    if (orderId && !loaded) throw new UserError("Unknown order.");
    const paidAt =
      loaded?.order.paid_at ?? loaded?.order.provider_created_at ?? new Date().toISOString();
    const result = await award(userId, orderId ?? "", paidAt, "owner", true);
    await audit(actor, "founding.award", "user", userId, null, { ...result, orderId }, reason);
    return result;
  }
  if (!member) throw new UserError("That account holds no place.");
  const next = action === "revoke" ? "revoked" : "active";
  if (member.status === next) throw new UserError(`The seal is already ${next}.`);
  const { error } = await admin()
    .from("founding_members")
    .update(
      action === "revoke"
        ? {
            status: "revoked",
            revoked_reason: reason,
            revoked_by: actor,
            revoked_at: new Date().toISOString(),
          }
        : { status: "active", revoked_reason: null, revoked_by: null, revoked_at: null },
    )
    .eq("user_id", userId);
  if (error) throw new Error(`founding update failed: ${error.message}`);
  await audit(
    actor,
    `founding.${action}`,
    "user",
    userId,
    { status: member.status },
    { status: next },
    reason,
  );
  return { awarded: next === "active", rank: member.rank, reason: next };
}
