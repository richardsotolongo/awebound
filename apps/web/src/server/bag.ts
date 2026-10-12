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
  return priceBag(lines, catalog.findVariants(lines));
}

/**
 * Creates a Fourthwall cart from the bag's in-stock lines and returns the hosted checkout URL.
 * Site SKUs are Fourthwall variant ids, so lines map straight to cart items. A piece that isn't
 * published in Fourthwall yet has no variant there, so a bag holding one can't check out: the
 * shopper gets a plain "try again" message and the bag stays as it is.
 */
export async function startCheckout(
  input: BagLineInput[],
  customerId?: string,
): Promise<CheckoutResult> {
  const catalog = await getCatalog();
  const priced = priceBag(input, catalog.findVariants(input));
  const lines = priced.lines.filter((l) => l.available);
  if (lines.length === 0) throw new UserError("Your bag has nothing available to check out.");
  if (lines.some((l) => l.preview)) {
    throw new UserError(
      "Checkout isn’t available right now. Your bag is saved, so please try again a little later.",
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
 * Prices a bag against the catalog (`catalog` maps each line's SKU to its variant, see
 * findVariants). The client's copy of prices is never trusted: lines that no longer match a
 * variant are dropped, sold-out lines are kept but flagged, lines for the same variant are merged
 * and quantities capped. A line comes back under its variant's current SKU.
 */
export function priceBag(input: BagLineInput[], catalog: Map<string, VariantWithProduct>): Bag {
  const currency = catalog.values().next().value?.product.currency ?? CURRENCY;
  const issues: BagIssue[] = [];
  const merged = new Map<string, { found: VariantWithProduct; requested: number }>();
  for (const line of input) {
    const found = catalog.get(line.sku);
    if (!found) {
      if (!issues.some((i) => i.sku === line.sku)) {
        issues.push({
          sku: line.sku,
          kind: "not_found",
          message: "A piece in your bag is no longer available and was removed.",
        });
      }
      continue;
    }
    const requested = (merged.get(found.variant.sku)?.requested ?? 0) + line.quantity;
    merged.set(found.variant.sku, { found, requested });
  }

  const lines: BagLine[] = [];
  for (const [sku, { found, requested }] of merged) {
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

  // What checkout would charge before shipping and tax: sold-out lines are not part of it.
  const subtotalCents = lines
    .filter((l) => l.available)
    .reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

  return { lines, subtotalCents, currency, issues };
}
