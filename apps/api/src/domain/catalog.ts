/**
 * Catalog entities. They are the plain data types from @awebound/shared (the published contract),
 * re-exported here so application code depends on the domain module, not on the transport package.
 */
export type {
  CatalogFacets,
  Category,
  Collection,
  Color,
  ProductDetail,
  ProductImage,
  ProductList,
  ProductQuery,
  ProductSummary,
  Sort,
  Variant,
} from "@awebound/shared";

import type { ProductDetail, ProductSummary, Variant } from "@awebound/shared";

/** A variant together with the product it belongs to: what the bag needs to price a line. */
export interface VariantWithProduct {
  variant: Variant;
  product: ProductSummary;
  /** The commerce provider's id for this variant (e.g. a Fourthwall variant id), when linked. */
  providerVariantId?: string;
}

/** Narrows a full product record to the listing shape. */
export function toSummary(product: ProductDetail): ProductSummary {
  return {
    code: product.code,
    slug: product.slug,
    name: product.name,
    collection: {
      slug: product.collection.slug,
      name: product.collection.name,
      pillar: product.collection.pillar,
    },
    category: product.category,
    baseColor: product.baseColor,
    priceCents: product.priceCents,
    currency: product.currency,
    colors: product.colors,
    sizes: product.sizes,
    scriptureRef: product.scriptureRef,
    image: product.image,
    hoverImage: product.hoverImage,
    featured: product.featured,
    releasedAt: product.releasedAt,
  };
}
