import "server-only";
import type { PaymentState } from "./types";

/**
 * What a Fourthwall order status means for payment. The exact status strings are unconfirmed
 * until the first real order (the admin Orders page lists every status seen); edit these sets
 * then. Anything unlisted is `unknown`, which grants nothing and shows up in admin.
 */
export const PAID_STATUSES = new Set([
  "CONFIRMED",
  "IN_PRODUCTION",
  "PARTIALLY_IN_PRODUCTION",
  "SHIPPED",
  "PARTIALLY_SHIPPED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
  "COMPLETED",
  "FULFILLED",
]);
export const REVOKED_STATUSES = new Set([
  "CANCELLED",
  "CANCELED",
  "REFUNDED",
  "CHARGEBACK",
  "DISPUTED",
  "FAILED",
]);
export const PENDING_STATUSES = new Set(["PLACED", "PENDING", "AWAITING_PAYMENT", "PROCESSING"]);
export const PARTIAL_REFUND_STATUSES = new Set(["PARTIALLY_REFUNDED"]);

export function paymentState(status: string | null | undefined): PaymentState {
  const s = (status ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (PAID_STATUSES.has(s) || PARTIAL_REFUND_STATUSES.has(s)) return "paid";
  if (REVOKED_STATUSES.has(s)) return "revoked";
  if (PENDING_STATUSES.has(s)) return "pending";
  return "unknown";
}

export function isPartialRefundStatus(status: string | null | undefined): boolean {
  return PARTIAL_REFUND_STATUSES.has((status ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_"));
}
