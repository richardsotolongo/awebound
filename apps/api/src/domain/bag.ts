import {
  MAX_LINE_QUANTITY,
  type Bag,
  type BagIssue,
  type BagLine,
  type BagLineInput,
} from "@awebound/shared";
import type { VariantWithProduct } from "./catalog";

export type { Bag, BagIssue, BagLine, BagLineInput };

/**
 * Prices a bag against the current catalog. The client's copy of prices is never trusted:
 * every line is re-read from the catalog, unknown SKUs are dropped, sold-out lines are kept but
 * flagged, duplicate SKUs are merged and quantities are capped.
 */
export function priceBag(
  input: BagLineInput[],
  catalog: Map<string, VariantWithProduct>,
  currency = "USD",
): Bag {
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
    });
  }

  const subtotalCents = lines
    .filter((l) => l.available)
    .reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

  return { lines, subtotalCents, currency, issues };
}
