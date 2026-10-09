import { SIZE_ORDER, type ProductDetail, type ProductImage } from "@awebound/shared";
import type { SeedCatalog } from "@awebound/shared/seed";
import type { FourthwallProduct, FourthwallVariant } from "./storefront-client";

export interface MergedCatalog {
  catalog: SeedCatalog;
  /** Site SKU (= Fourthwall variant id) → Fourthwall variant id. */
  providerIds: Map<string, string>;
  /** Fourthwall products with no matching brand content (not shown on the site). */
  unmatched: string[];
  /** Content entries with no matching Fourthwall product (not for sale yet). */
  missing: string[];
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function inStock(product: FourthwallProduct, variant: FourthwallVariant): boolean {
  if (product.state !== "AVAILABLE") return false;
  if (variant.stock.type === "UNLIMITED") return true;
  return (variant.stock.inStock ?? 0) > 0;
}

function sizeRank(size: string): number {
  const i = (SIZE_ORDER as readonly string[]).indexOf(size);
  return i === -1 ? SIZE_ORDER.length : i;
}

const VIEWS: ProductImage["view"][] = ["back", "front"];

/**
 * Fourthwall is the source of truth for what can be bought (variants, prices, stock, photos);
 * the site's catalog content is the source of truth for the brand story (ID, collection, cut,
 * Scripture, copy). A product appears on the site only when both exist, matched by slug.
 * Variant SKUs on the site are the Fourthwall variant ids, so checkout can build the cart directly.
 */
export function mergeFourthwallCatalog(
  content: SeedCatalog,
  products: FourthwallProduct[],
): MergedCatalog {
  const bySlug = new Map(
    products.filter((p) => !p.access || p.access === "PUBLIC").map((p) => [p.slug, p]),
  );
  const tokens = new Map(
    Object.entries(content.colorTokens ?? {}).map(([name, token]) => [norm(name), token]),
  );
  const providerIds = new Map<string, string>();
  const used = new Set<string>();
  const missing: string[] = [];
  const merged: ProductDetail[] = [];

  for (const item of content.products) {
    const fwSlug = content.fourthwallSlugs?.[item.slug] ?? item.slug;
    const fw = bySlug.get(fwSlug);
    if (!fw || fw.variants.length === 0) {
      missing.push(item.slug);
      continue;
    }
    used.add(fw.slug);

    const variants = fw.variants
      .map((v) => ({
        sku: v.id,
        color: v.attributes.color?.name ?? item.baseColor,
        size: v.attributes.size?.name ?? "One size",
        available: inStock(fw, v),
        priceCents: Math.round(v.unitPrice.value * 100),
        swatch: v.attributes.color?.swatch ?? undefined,
      }))
      .sort((a, b) => sizeRank(a.size) - sizeRank(b.size));
    for (const v of variants) providerIds.set(v.sku, v.sku);

    const colors: ProductDetail["colors"] = [];
    for (const v of fw.variants) {
      const name = v.attributes.color?.name ?? item.baseColor;
      if (colors.some((c) => c.name === name)) continue;
      const token =
        tokens.get(norm(name)) ?? item.colors.find((c) => norm(c.name) === norm(name))?.token ?? "";
      colors.push({
        name,
        token,
        ...(token ? {} : { swatch: v.attributes.color?.swatch ?? undefined }),
      });
    }
    const sizes = [...new Set(variants.map((v) => v.size))].sort(
      (a, b) => sizeRank(a) - sizeRank(b),
    );

    const photos = fw.images.length > 0 ? fw.images : fw.variants.flatMap((v) => v.images ?? []);
    const images: ProductImage[] =
      photos.length > 0
        ? photos.map((img, i) => {
            const view = VIEWS[i] ?? "detail";
            return {
              url: img.transformedUrl || img.url,
              alt: `${item.name} ${item.category.cut.toLowerCase()}, ${view} view`,
              view,
            };
          })
        : item.images;
    const image = images[0] ?? item.image;

    merged.push({
      ...item,
      baseColor: colors[0]?.name ?? item.baseColor,
      priceCents: Math.min(...variants.map((v) => v.priceCents)),
      currency: fw.variants[0]?.unitPrice.currency ?? item.currency,
      colors,
      sizes,
      image,
      hoverImage: images[1] ?? null,
      images,
      variants: variants.map(({ swatch: _s, ...v }) => v),
    });
  }

  return {
    catalog: { ...content, products: merged },
    providerIds,
    unmatched: [...bySlug.keys()].filter((slug) => !used.has(slug)),
    missing,
  };
}
