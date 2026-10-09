import type { CheckoutResult } from "@awebound/shared";
import type { BagLine } from "../../domain/bag";

export interface CheckoutLine extends BagLine {
  /** The provider's variant id, from the catalog. Missing when the piece isn't linked yet. */
  providerVariantId?: string;
}

export interface CheckoutSession {
  /** Priced, available lines only. */
  lines: CheckoutLine[];
  subtotalCents: number;
  currency: string;
  email?: string;
  /** Supabase user id when the shopper is signed in. */
  customerId?: string;
}

/**
 * Starts a checkout with whichever commerce provider is configured.
 *
 * - Fourthwall: create a Storefront API cart and return its hosted checkout URL.
 * - Printful, Printify, Apliiq: these only print and ship, so an adapter must first take payment
 *   (a payment provider's hosted checkout), then create the order through FulfillmentGateway
 *   from the payment webhook.
 *
 * Until a provider is chosen the container wires UnconfiguredCheckoutGateway.
 */
export interface CheckoutGateway {
  readonly provider: string;
  createCheckout(session: CheckoutSession): Promise<CheckoutResult>;
}
