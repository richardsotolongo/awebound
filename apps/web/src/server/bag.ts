import {
  MAX_LINE_QUANTITY,
  type Bag,
  type BagIssue,
  type BagLine,
  type BagLineInput,
  type CheckoutResult,
} from "@/shared";
import { getCatalog } from "./catalog";
import type { VariantWithProduct } from "./catalog-search";
import { serverEnv } from "./env";
import { UserError } from "./errors";
import { createCart, CURRENCY, FourthwallApiError } from "./fourthwall";

const SOLD_OUT_CODES = new Set([
  "CART_OFFER_NOT_AVAILABLE",
  "CART_QUANTITY_TOO_HIGH",
  "OFFER_VARIANT_NOT_FOUND_ERROR",
  "CART_OFFER_NOT_FOUND",
]);

/** Re-prices the shopper's bag from the live catalog. */
export async function validateBag(lines: BagLineInput[]): Promise<Bag> {
  const catalog = await getCatalog();
  return priceBag(lines, catalog.findVariants(lines.map((l) => l.sku)));
}

/**
 * Creates a Fourthwall cart from the bag's available lines and returns the hosted checkout URL.
 * Site SKUs are Fourthwall variant ids, so lines map straight to cart items.
 */
export async function startCheckout(
  input: BagLineInput[],
  customerId?: string,
): Promise<CheckoutResult> {
  const catalog = await getCatalog();
  const priced = priceBag(input, catalog.findVariants(input.map((l) => l.sku)));
  const lines = priced.lines.filter((l) => l.available);
  if (lines.length === 0) throw new UserError("Your bag has nothing available to check out.");
  // Previews aren't in Fourthwall yet, so there is nothing to put in a cart.
  if (lines.some((l) => catalog.findBySlug(l.productSlug)?.preview)) {
    throw new UserError(
      "Checkout for the Behold release opens soon. Leave your email in the bag and we’ll tell you the day it opens.",
    );
  }

  let cartId: string;
  try {
    cartId = await createCart(
      lines.map((l) => ({ variantId: l.sku, quantity: l.quantity })),
      { source: "awebound-site", ...(customerId ? { customer: customerId } : {}) },
    );
  } catch (err) {
    if (err instanceof FourthwallApiError && err.code && SOLD_OUT_CODES.has(err.code)) {
      throw new UserError("Something in your bag just sold out. Refresh your bag and try again.");
    }
    console.error("[checkout] cart creation failed:", err);
    throw new UserError("Checkout is unreachable right now. Try again in a moment.");
  }

  const domain = serverEnv.FOURTHWALL_CHECKOUT_DOMAIN.replace(/^https?:\/\//, "").replace(
    /\/.*$/,
    "",
  );
  const url = new URL(`https://${domain}/checkout/`);
  url.searchParams.set("cartCurrency", CURRENCY);
  url.searchParams.set("cartId", cartId);
  return { url: url.toString() };
}

/**
 * Prices a bag against the catalog. The client's copy of prices is never trusted: unknown SKUs
 * are dropped, sold-out lines are kept but flagged, duplicate SKUs are merged and quantities capped.
 */
export function priceBag(input: BagLineInput[], catalog: Map<string, VariantWithProduct>): Bag {
  const currency = catalog.values().next().value?.product.currency ?? CURRENCY;
  const issues: BagIssue[] = [];
  const merged = new Map<string, number>();
  for (const line of input) merged.set(line.sku, (merged.get(line.sku) ?? 0) + line.quantity);

  const lines: BagLine[] = [];
  for (const [sku, requested] of merged) {
    const found = catalog.get(sku);
    if (!found) {
      issues.push({
        sku,
        kind: "not_found",
        message: "This item is no longer in the shop and was removed.",
      });
      continue;
    }
    const quantity = Math.min(requested, MAX_LINE_QUANTITY);
    if (quantity !== requested) {
      issues.push({
        sku,
        kind: "quantity_adjusted",
        message: `Limited to ${MAX_LINE_QUANTITY} per size.`,
      });
    }
    const { variant, product } = found;
    if (!variant.available) {
      issues.push({
        sku,
        kind: "sold_out",
        message: `${product.name} in ${variant.color}, ${variant.size} is sold out.`,
      });
    }
    lines.push({
      sku,
      productSlug: product.slug,
      code: product.code,
      name: product.name,
      cut: product.category.cut,
      color: variant.color,
      size: variant.size,
      image: product.image,
      unitPriceCents: variant.priceCents,
      quantity,
      available: variant.available,
      preview: product.preview,
    });
  }

  const subtotalCents = lines
    .filter((l) => l.available)
    .reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

  return { lines, subtotalCents, currency, issues };
}
