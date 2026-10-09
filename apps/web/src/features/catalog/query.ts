import {
  ProductQuerySchema,
  type CatalogFacets,
  type CollectionSlug,
  type ProductList,
  type ProductQuery,
  type ProductSummary,
} from "@awebound/shared";
import { formatPrice } from "@awebound/shared";
import type { ProductCardProps } from "@awebound/brand";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 12;

/** Reads the shop URL into a validated query. Bad values fall back to defaults instead of erroring. */
export function parseCatalogQuery(
  raw: RawSearchParams,
  locked: { collection?: CollectionSlug } = {},
): ProductQuery {
  const input = { ...raw, page: undefined, pageSize: PAGE_SIZE };
  const parsed = ProductQuerySchema.safeParse(input);
  const query = parsed.success
    ? parsed.data
    : ProductQuerySchema.parse({
        q: typeof raw.q === "string" ? raw.q : undefined,
        pageSize: PAGE_SIZE,
      });
  if (locked.collection) query.collection = [locked.collection];
  return query;
}

/** The query as plain values for the API client and for re-fetching more pages. */
export function toApiQuery(query: ProductQuery) {
  return {
    q: query.q,
    category: query.category,
    collection: query.collection,
    color: query.color,
    size: query.size,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sort: query.sort,
    pageSize: query.pageSize,
  };
}

export const EMPTY_LIST: ProductList = {
  items: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  hasMore: false,
};
export const EMPTY_FACETS: CatalogFacets = {
  categories: [],
  collections: [],
  colors: [],
  sizes: [],
  price: { min: 0, max: 0 },
};

/** Maps a listing product to the brand ProductCard. */
export function toCardProps(p: ProductSummary, priority = false): ProductCardProps {
  return {
    id: p.code,
    name: p.name,
    base: `${p.category.cut} · ${p.baseColor}`,
    swatches: p.colors.map((c) => `var(--${c.token})`),
    scripture: p.scriptureRef,
    image: p.image.url,
    imageAlt: p.image.alt,
    hoverImage: p.hoverImage?.url,
    href: `/shop/${p.slug}`,
    price: formatPrice(p.priceCents, p.currency),
    priority,
  };
}
