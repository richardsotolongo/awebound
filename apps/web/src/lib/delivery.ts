/**
 * Fulfillment facts shown beside the buy button. Only confirmed details go here: leave a value
 * null until it is confirmed with Fourthwall, and the product page says it will be confirmed
 * before ordering opens.
 */
export const DELIVERY = {
  /** Every piece is printed or embroidered after it is ordered. */
  madeToOrder: true,
  /** Confirmed production time, e.g. "2–5 business days". Null until confirmed. */
  productionTime: null as string | null,
  /** Estimated shipping time once it ships, e.g. "3–7 business days in the US". Null until confirmed. */
  shippingTime: null as string | null,
  /** Days after delivery to report a misprint, damage or wrong item (see /refunds). */
  problemWindowDays: 30,
} as const;
