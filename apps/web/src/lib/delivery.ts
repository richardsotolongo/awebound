/**
 * Fulfillment facts shown beside the buy button. Only confirmed details go here: leave a value
 * null until it is confirmed with Fourthwall. Until then a preview's page says it will be confirmed
 * before ordering opens, and a piece that can be ordered says to ask.
 */
export const DELIVERY = {
  /** Every piece is printed or embroidered after it is ordered. */
  madeToOrder: true,
  /** Confirmed production time, e.g. "2–5 business days". Null until confirmed. */
  productionTime: null as string | null,
  /** Estimated shipping time once it ships, e.g. "3–7 business days in the US". Null until confirmed. */
  shippingTime: null as string | null,
  /** Days after delivery to report damage, a misprint, a defect or a wrong item or size (see /refunds). */
  problemWindowDays: 30,
} as const;
