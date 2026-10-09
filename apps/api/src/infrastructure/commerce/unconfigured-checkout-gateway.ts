import type { CheckoutResult } from "@awebound/shared";
import type { CheckoutGateway } from "../../application/ports";

/**
 * The checkout adapter until the owner chooses a commerce provider. It never charges anyone;
 * the storefront answers with "Checkout opens soon" and offers to notify the shopper.
 *
 * To plug in a provider, implement CheckoutGateway in this folder (for example
 * fourthwall-checkout-gateway.ts) and select it in src/container.ts from COMMERCE_PROVIDER.
 */
export class UnconfiguredCheckoutGateway implements CheckoutGateway {
  readonly provider = "none";

  async createCheckout(): Promise<CheckoutResult> {
    return {
      status: "unavailable",
      message: "Checkout opens soon. Leave your email and we’ll tell you the moment it does.",
    };
  }
}
