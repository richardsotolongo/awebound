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
 * Hands a priced bag to the configured commerce provider. Guest checkout is allowed;
 * a signed-in shopper's id is passed along so orders can be linked to their profile later.
 * Prices come from the catalog again here, never from the client.
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
    const lines = bag.lines
      .filter((l) => l.available)
      .map((l) => ({ ...l, providerVariantId: catalog.get(l.sku)?.providerVariantId }));
    if (lines.length === 0) {
      throw new ValidationError("Your bag has nothing available to check out.");
    }
    const result = await this.checkout.createCheckout({
      lines,
      subtotalCents: bag.subtotalCents,
      currency: bag.currency,
      email: request.email,
      customerId,
    });
    this.logger.info(
      {
        provider: this.checkout.provider,
        status: result.status,
        lines: lines.length,
        subtotalCents: bag.subtotalCents,
      },
      "checkout requested",
    );
    return result;
  }
}
