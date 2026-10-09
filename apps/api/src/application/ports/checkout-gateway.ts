import type { CheckoutResult } from "@awebound/shared";
import type { BagLine } from "../../domain/bag";

export interface CheckoutSession {
  /** Priced, available lines only. Each SKU is a Fourthwall variant id. */
  lines: BagLine[];
  /** Supabase user id when the shopper is signed in. */
  customerId?: string;
}

/**
 * Starts a checkout: the Fourthwall adapter creates a Storefront API cart and returns its hosted
 * checkout URL. Fourthwall takes payment, prints and ships.
 */
export interface CheckoutGateway {
  createCheckout(session: CheckoutSession): Promise<CheckoutResult>;
}
