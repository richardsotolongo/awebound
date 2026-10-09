import type { CheckoutRequest, CheckoutResult } from "@awebound/shared";
import { priceBag, type Bag, type BagLineInput } from "../../domain/bag";
import { ValidationError } from "../../domain/errors";
import type { CheckoutGateway, Logger, ProductRepository } from "../ports";

/** Re-prices the shopper's bag from the catalog and reports anything that changed. */
export class ValidateBag {
  constructor(private readonly products: ProductRepository) {}

  async execute(lines: BagLineInput[]): Promise<Bag> {
    if (lines.length === 0) return { lines: [], subtotalCents: 0, currency: "USD", issues: [] };
    const catalog = await this.products.findVariantsBySkus([...new Set(lines.map((l) => l.sku))]);
    const currency = catalog.values().next().value?.product.currency ?? "USD";
    return priceBag(lines, catalog, currency);
  }
}

/**
 * Hands a priced bag to the checkout (Fourthwall's hosted checkout). Guest checkout is allowed;
 * a signed-in shopper's id is passed along so orders can be linked to their profile later.
 * Lines are re-read from the catalog here, never trusted from the client; Fourthwall prices the cart.
 */
export class StartCheckout {
  constructor(
    private readonly products: ProductRepository,
    private readonly checkout: CheckoutGateway,
    private readonly logger: Logger,
  ) {}

  async execute(request: CheckoutRequest, customerId?: string): Promise<CheckoutResult> {
    const catalog = await this.products.findVariantsBySkus([
      ...new Set(request.lines.map((l) => l.sku)),
    ]);
    const currency = catalog.values().next().value?.product.currency ?? "USD";
    const bag = priceBag(request.lines, catalog, currency);
    const lines = bag.lines.filter((l) => l.available);
    if (lines.length === 0) {
      throw new ValidationError("Your bag has nothing available to check out.");
    }
    const result = await this.checkout.createCheckout({ lines, customerId });
    this.logger.info({ lines: lines.length, subtotalCents: bag.subtotalCents }, "checkout started");
    return result;
  }
}
