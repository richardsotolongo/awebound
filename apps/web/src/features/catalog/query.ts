import {
  LATEST_DROP,
  ProductQuerySchema,
  type CatalogFacets,
  type CollectionSlug,
  type ProductList,
  type ProductQuery,
  type ProductSummary,
} from "@/shared";
import { formatPrice } from "@/shared";
import type { ProductCardProps } from "@awebound/brand";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 12;

/** Reads the shop URL into a validated query. Bad values fall back to defaults instead of erroring. */
export function parseCatalogQuery(
  raw: RawSearchParams,
  locked: { collection?: CollectionSlug } = {},
): ProductQuery {
  // The collection is chosen by the collection selector (see collectionChoice), not parsed here.
  const input = { ...raw, collection: undefined, page: undefined, pageSize: PAGE_SIZE };
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

/**
 * Maps a listing product to the brand ProductCard: name, garment type, price and the piece's
 * Scripture. The internal design code is never shown.
 */
export function toCardProps(p: ProductSummary, priority = false): ProductCardProps {
  return {
    name: p.name,
    type: p.category.cut,
    quote: p.scripture,
    image: p.image.url,
    imageAlt: p.image.alt,
    hoverImage: p.hoverImage?.url,
    href: `/shop/${p.slug}`,
    price: formatPrice(p.priceCents, p.currency),
    priority,
  };
}

/**
 * The collection selector's value from the URL: no value (or "latest") is the Latest Drop,
 * "all" is every collection, anything else a release slug.
 */
export function collectionChoice(raw: RawSearchParams): string {
  const value = Array.isArray(raw.collection) ? raw.collection[0] : raw.collection;
  const clean = value?.trim().toLowerCase();
  return clean && /^[a-z0-9-]+$/.test(clean) ? clean : LATEST_DROP;
}

/** A shop URL with some params changed; `null` removes one. Always starts from page one. */
export function shopHref(
  basePath: string,
  raw: RawSearchParams,
  changes: Record<string, string | null>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (k === "page" || v === undefined) continue;
    params.set(k, Array.isArray(v) ? v.join(",") : v);
  }
  for (const [k, v] of Object.entries(changes)) {
    if (v === null) params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
