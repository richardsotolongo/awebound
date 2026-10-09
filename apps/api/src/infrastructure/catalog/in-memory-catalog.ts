import type { SeedCatalog } from "@awebound/shared/seed";
import { SIZE_ORDER } from "@awebound/shared";
import {
  toSummary,
  type CatalogFacets,
  type Collection,
  type ProductDetail,
  type ProductQuery,
  type VariantWithProduct,
} from "../../domain/catalog";
import type { ProductRepository, ProductSearchResult } from "../../application/ports";

type Filters = Pick<
  ProductQuery,
  "q" | "category" | "collection" | "color" | "size" | "minPrice" | "maxPrice"
>;

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[–—]/g, "-");

/** Crude English stemming, close enough to Postgres for a small catalog: chains → chain, rolled → roll. */
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");

function haystack(p: ProductDetail): string[] {
  const text = [
    p.name,
    p.code,
    p.scriptureRef,
    p.story.art,
    p.story.back,
    p.collection.name,
    p.category.name,
  ].join(" ");
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem);
}

/**
 * Offline catalog backed by the shared seed. Mirrors supabase/migrations/*_catalog_search.sql:
 * same filters, the same "each facet ignores its own filter" counting and the same sort order.
 */
export class InMemoryProductRepository implements ProductRepository {
  private readonly products: ProductDetail[];
  private readonly words = new Map<string, string[]>();

  constructor(private readonly catalog: SeedCatalog) {
    this.products = catalog.products;
    for (const p of this.products) this.words.set(p.slug, haystack(p));
  }

  private rank(p: ProductDetail, q: string | undefined): number | null {
    const query = normalize(q?.trim() ?? "");
    if (!query) return 0;
    const name = normalize(p.name);
    const code = normalize(p.code);
    const terms = query
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map(stem);
    const words = this.words.get(p.slug) ?? [];
    const allTermsMatch =
      terms.length > 0 && terms.every((t) => words.some((w) => w.startsWith(t)));
    if (!allTermsMatch && !name.includes(query) && !code.startsWith(query)) return null;
    return (
      terms.filter((t) => words.some((w) => w.startsWith(t))).length +
      (name.startsWith(query) ? 1 : 0)
    );
  }

  private matches(p: ProductDetail, f: Filters): boolean {
    if (this.rank(p, f.q) === null) return false;
    if (f.category?.length && !f.category.includes(p.category.slug)) return false;
    if (f.collection?.length && !f.collection.includes(p.collection.slug)) return false;
    if (f.minPrice !== undefined && p.priceCents < f.minPrice * 100) return false;
    if (f.maxPrice !== undefined && p.priceCents > f.maxPrice * 100) return false;
    if (f.color?.length && !p.variants.some((v) => f.color!.includes(v.color))) return false;
    if (f.size?.length && !p.variants.some((v) => v.available && f.size!.includes(v.size)))
      return false;
    return true;
  }

  async search(query: ProductQuery): Promise<ProductSearchResult> {
    const matched = this.products
      .filter((p) => this.matches(p, query))
      .map((p) => ({ p, rank: this.rank(p, query.q) ?? 0 }));

    const byDefault = (a: ProductDetail, b: ProductDetail) =>
      b.releasedAt.localeCompare(a.releasedAt) || a.name.localeCompare(b.name);
    const sorters: Record<
      ProductQuery["sort"],
      (a: { p: ProductDetail; rank: number }, b: { p: ProductDetail; rank: number }) => number
    > = {
      featured: (a, b) =>
        b.rank - a.rank || Number(b.p.featured) - Number(a.p.featured) || byDefault(a.p, b.p),
      newest: (a, b) => byDefault(a.p, b.p),
      "price-asc": (a, b) => a.p.priceCents - b.p.priceCents || byDefault(a.p, b.p),
      "price-desc": (a, b) => b.p.priceCents - a.p.priceCents || byDefault(a.p, b.p),
      name: (a, b) => a.p.name.localeCompare(b.p.name) || byDefault(a.p, b.p),
    };
    matched.sort(sorters[query.sort]);

    const start = (query.page - 1) * query.pageSize;
    return {
      items: matched.slice(start, start + query.pageSize).map(({ p }) => toSummary(p)),
      total: matched.length,
    };
  }

  async facets(query: ProductQuery): Promise<CatalogFacets> {
    const count = (except: keyof Filters, pred: (p: ProductDetail) => boolean) =>
      this.products.filter((p) => this.matches(p, { ...query, [except]: undefined }) && pred(p))
        .length;

    const colors = new Map<string, string>();
    const sizes = new Set<string>();
    for (const p of this.products) {
      for (const c of p.colors) colors.set(c.name, c.token);
      for (const s of p.sizes) sizes.add(s);
    }
    const order = SIZE_ORDER as readonly string[];
    const prices = this.products.map((p) => p.priceCents);

    return {
      categories: this.catalog.categories.map((c) => ({
        ...c,
        count: count("category", (p) => p.category.slug === c.slug),
      })),
      collections: this.catalog.collections.map((c) => ({
        slug: c.slug,
        name: c.name,
        pillar: c.pillar,
        count: count("collection", (p) => p.collection.slug === c.slug),
      })),
      colors: [...colors]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, token]) => ({
          name,
          token,
          count: count("color", (p) => p.colors.some((c) => c.name === name)),
        })),
      sizes: [...sizes]
        .sort((a, b) => order.indexOf(a) - order.indexOf(b))
        .map((size) => ({
          size,
          count: count("size", (p) => p.variants.some((v) => v.available && v.size === size)),
        })),
      price: {
        min: prices.length ? Math.floor(Math.min(...prices) / 100) : 0,
        max: prices.length ? Math.ceil(Math.max(...prices) / 100) : 0,
      },
    };
  }

  async findBySlug(slug: string): Promise<ProductDetail | null> {
    return this.products.find((p) => p.slug === slug) ?? null;
  }

  async findVariantsBySkus(skus: string[]): Promise<Map<string, VariantWithProduct>> {
    const wanted = new Set(skus);
    const found = new Map<string, VariantWithProduct>();
    for (const p of this.products) {
      for (const v of p.variants) {
        if (wanted.has(v.sku)) found.set(v.sku, { variant: v, product: toSummary(p) });
      }
    }
    return found;
  }

  async listCollections(): Promise<Collection[]> {
    return this.catalog.collections;
  }
}
