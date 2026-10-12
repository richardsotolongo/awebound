/**
 * Fulfillment facts shown beside the buy button and in the FAQ. Times are Fourthwall's standard
 * ones for made-to-order products (help.fourthwall.com, "Shipping and delivery expectations");
 * a null value makes the page say to ask instead.
 */
export const DELIVERY = {
  /** Every piece is printed or embroidered after it is ordered. */
  madeToOrder: true,
  /** Production time before an order ships. */
  productionTime: "2–5 business days" as string | null,
  /** Transit time once an order ships. */
  shippingTime: "3–7 business days in the US, 2–4 weeks elsewhere" as string | null,
  /** Days after delivery to report damage, a misprint, a defect or a wrong item or size (see /refunds). */
  problemWindowDays: 30,
} as const;
