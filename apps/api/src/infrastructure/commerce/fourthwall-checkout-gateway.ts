import type { CheckoutResult } from "@awebound/shared";
import type { CheckoutGateway, CheckoutSession, Logger } from "../../application/ports";
import { UnavailableError, ValidationError } from "../../domain/errors";
import { FourthwallApiError, type FourthwallStorefront } from "../fourthwall/storefront-client";

const SOLD_OUT_CODES = new Set([
  "CART_OFFER_NOT_AVAILABLE",
  "CART_QUANTITY_TOO_HIGH",
  "OFFER_VARIANT_NOT_FOUND_ERROR",
  "CART_OFFER_NOT_FOUND",
]);

/**
 * Fourthwall takes payment and fulfills, so checkout is a redirect: build a Storefront API cart
 * from the bag and send the shopper to Fourthwall's hosted checkout on the shop's checkout domain.
 */
export class FourthwallCheckoutGateway implements CheckoutGateway {
  readonly provider = "fourthwall";
  private readonly domain: string;

  constructor(
    private readonly storefront: FourthwallStorefront,
    checkoutDomain: string,
    private readonly currency: string,
    private readonly logger: Logger,
  ) {
    this.domain = checkoutDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }

  async createCheckout(session: CheckoutSession): Promise<CheckoutResult> {
    const unlinked = session.lines.find((l) => !l.providerVariantId);
    if (unlinked) {
      throw new UnavailableError(
        `${unlinked.name} isn’t ready for checkout yet. Remove it from your bag, or write to us and we’ll help.`,
      );
    }

    const quantities = new Map<string, number>();
    for (const line of session.lines) {
      const id = line.providerVariantId!;
      quantities.set(id, (quantities.get(id) ?? 0) + line.quantity);
    }
    const items = [...quantities].map(([variantId, quantity]) => ({ variantId, quantity }));

    let cartId: string;
    try {
      ({ id: cartId } = await this.storefront.createCart(items, {
        source: "awebound-site",
        ...(session.customerId ? { customer: session.customerId } : {}),
      }));
    } catch (err) {
      if (err instanceof FourthwallApiError && err.code && SOLD_OUT_CODES.has(err.code)) {
        throw new ValidationError(
          "Something in your bag just sold out. Refresh your bag and try again.",
        );
      }
      this.logger.error({ err }, "fourthwall cart creation failed");
      throw new UnavailableError("Checkout is unreachable right now. Try again in a moment.");
    }

    const url = new URL(`https://${this.domain}/checkout/`);
    url.searchParams.set("cartCurrency", this.currency);
    url.searchParams.set("cartId", cartId);
    return { status: "redirect", url: url.toString() };
  }
}
