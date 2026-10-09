/**
 * Sends paid orders to a print-on-demand provider and reads their status.
 * Declared now so the architecture has a place for it; nothing implements it until the owner
 * picks a provider (see docs/TODOS.md). Fourthwall handles fulfillment itself and won't need it.
 */
export interface FulfillmentOrderLine {
  sku: string;
  /** The provider's own variant id, from product_variants.provider_variant_id. */
  providerVariantId: string;
  quantity: number;
}

export interface FulfillmentAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  email: string;
  phone?: string;
}

export interface FulfillmentOrder {
  /** Our order reference, e.g. the payment session id. */
  externalId: string;
  lines: FulfillmentOrderLine[];
  shipTo: FulfillmentAddress;
}

export type FulfillmentStatus = "pending" | "in_production" | "shipped" | "delivered" | "canceled" | "failed";

export interface FulfillmentGateway {
  readonly provider: string;
  createOrder(order: FulfillmentOrder): Promise<{ providerOrderId: string }>;
  getOrderStatus(providerOrderId: string): Promise<{ status: FulfillmentStatus; trackingUrl?: string }>;
}
