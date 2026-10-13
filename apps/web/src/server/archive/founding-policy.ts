import "server-only";
import type { CandidateReason, OrderRow, ProfileRow } from "./types";

/**
 * The Founding Member policy, in one place. The SQL function archive_award_founding holds the
 * same two numbers; docs/ARCHIVE.md explains the rules in full. Change them here, there and in
 * the docs together.
 */
export const FOUNDING_CAP = 50;
export const FOUNDING_SETTLE_FROM = 45;

export const FOUNDING_RULES = [
  "The first 50 unique buyers who paid for an eligible order placed while signed in to their Awebound account receive the seal.",
  "A place needs a real paid order (not a test, sample or gift redemption), a cart created while signed in, a verified account email, and the same email on the order.",
  "Guest purchases never qualify, and a guest order claimed later stays a guest order. A later separate purchase made while signed in can qualify if a place remains.",
  "Several orders from one member use one place. Places are counted by the earliest trusted payment time, with the provider's order id as the tie-break; never by sign-up time or by when an event arrived.",
  `Places 1 to ${FOUNDING_SETTLE_FROM} are awarded as payments are confirmed. Places ${FOUNDING_SETTLE_FROM + 1} to ${FOUNDING_CAP} are settled only after the provider's own order list has confirmed the order of payments, so a delayed event can't lose a place to a later buyer.`,
  "Once earned, the seal stays as recognition after an ordinary refund, and its place is not recycled; the refunded design's story and downloads still close.",
  "Failed, cancelled-before-payment, test, duplicate, fraudulent or wrongly linked transactions never establish an award. The owner can revoke or restore an award, and every change is audited.",
  "The seal carries no discount, points or perks, and no rank or count is shown in public.",
];

export type Qualification =
  | { ok: true }
  | { ok: false; reason: CandidateReason | "not_paid" | "test" | "not_order" | "unlinked" };

/** Whether an order can earn its buyer a place. Candidate reasons are recorded; the rest are final. */
export function qualifies(order: OrderRow, profile: ProfileRow | null, flagOn: boolean): Qualification {
  if (order.payment_state !== "paid") return { ok: false, reason: "not_paid" };
  if (order.test_mode) return { ok: false, reason: "test" };
  if (order.source_type !== "ORDER") return { ok: false, reason: "not_order" };
  if (!order.user_id) return { ok: false, reason: "unlinked" };
  if (!flagOn) return { ok: false, reason: "flag_off" };
  if (order.registered_checkout !== true || order.link_method !== "checkout_session")
    return { ok: false, reason: "no_checkout_evidence" };
  const account = profile?.email?.trim().toLowerCase();
  const onOrder = order.email?.trim().toLowerCase();
  if (!profile?.email_verified_at || !account || !onOrder || account !== onOrder)
    return { ok: false, reason: "email_mismatch" };
  return { ok: true };
}

export const CANDIDATE_REASONS: ReadonlySet<string> = new Set([
  "contested_window",
  "email_mismatch",
  "no_checkout_evidence",
  "flag_off",
  "cap_reached",
]);
