import {
  SIZE_ORDER,
  type CatalogFacets,
  type Category,
  type Collection,
  type ProductDetail,
  type ProductList,
  type ProductQuery,
  type ProductSummary,
  type Release,
  type Variant,
} from "@/shared";

/** Everything the shop lists: categories and collections from the brand content, merged products. */
export interface Catalog {
  categories: Category[];
  collections: Collection[];
  products: ProductDetail[];
}

/** A variant together with the product it belongs to: what the bag needs to price a line. */
export interface VariantWithProduct {
  variant: Variant;
  product: ProductSummary;
}

export function toSummary(p: ProductDetail): ProductSummary {
  return {
    code: p.code,
    slug: p.slug,
    name: p.name,
    collection: {
      slug: p.collection.slug,
      name: p.collection.name,
      number: p.collection.number,
      tagline: p.collection.tagline,
    },
    position: p.position,
    preview: p.preview,
    category: p.category,
    baseColor: p.baseColor,
    priceCents: p.priceCents,
    currency: p.currency,
    colors: p.colors,
    sizes: p.sizes,
    scripture: p.scripture,
    image: p.image,
    hoverImage: p.hoverImage,
    featured: p.featured,
    releasedAt: p.releasedAt,
  };
}

type Filters = Pick<
  ProductQuery,
  "q" | "category" | "collection" | "color" | "size" | "minPrice" | "maxPrice"
>;

/** Known sizes in display order; anything Fourthwall adds goes after them. */
const rankSize = (size: string, order: readonly string[]) => {
  const i = order.indexOf(size);
  return i === -1 ? order.length : i;
};

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[–—]/g, "-");

/** Crude English stemming, enough for a small catalog: chains → chain, rolled → roll. */
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");

function haystack(p: ProductDetail): string[] {
  // Internal design codes are left out: customers find a piece by its name, art and Scripture.
  const text = [
    p.name,
    p.scripture.reference,
    p.scripture.text,
    p.story.theme,
    p.story.art,
    p.story.front,
    p.story.back,
    p.collection.name,
    p.category.name,
    ...p.colors.map((c) => c.name),
  ].join(" ");
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem);
}

/**
 * Search, filters, facets and sorting over the merged Fourthwall catalog, held in memory.
 * Each facet ignores its own filter when counting, so a chosen option never zeroes its siblings.
 */
export class CatalogIndex {
  private readonly products: ProductDetail[];
  private readonly words = new Map<string, string[]>();

  constructor(private readonly catalog: Catalog) {
    this.products = catalog.products;
    for (const p of this.products) this.words.set(p.slug, haystack(p));
  }

  private rank(p: ProductDetail, q: string | undefined): number | null {
    const query = normalize(q?.trim() ?? "");
    if (!query) return 0;
    const name = normalize(p.name);
    const terms = query
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map(stem);
    const words = this.words.get(p.slug) ?? [];
    const allTermsMatch =
      terms.length > 0 && terms.every((t) => words.some((w) => w.startsWith(t)));
    if (!allTermsMatch && !name.includes(query)) return null;
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

  search(query: ProductQuery): ProductList {
    const matched = this.products
      .filter((p) => this.matches(p, query))
      .map((p) => ({ p, rank: this.rank(p, query.q) ?? 0 }));

    const byDefault = (a: ProductDetail, b: ProductDetail) =>
      b.releasedAt.localeCompare(a.releasedAt) ||
      a.position - b.position ||
      a.name.localeCompare(b.name);
    const sorters: Record<
      ProductQuery["sort"],
      (a: { p: ProductDetail; rank: number }, b: { p: ProductDetail; rank: number }) => number
    > = {
      // Release order: newest release first, then each piece's place in it (I–VI).
      featured: (a, b) => b.rank - a.rank || byDefault(a.p, b.p),
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
      page: query.page,
      pageSize: query.pageSize,
      hasMore: start + query.pageSize < matched.length,
    };
  }

  facets(query: ProductQuery): CatalogFacets {
    const count = (except: keyof Filters, pred: (p: ProductDetail) => boolean) =>
      this.products.filter((p) => this.matches(p, { ...query, [except]: undefined }) && pred(p))
        .length;

    const colors = new Map<string, { token: string; swatch?: string }>();
    const sizes = new Set<string>();
    for (const p of this.products) {
      for (const c of p.colors) colors.set(c.name, { token: c.token, swatch: c.swatch });
      for (const s of p.sizes) sizes.add(s);
    }
    const order = SIZE_ORDER as readonly string[];
    const prices = this.products.map((p) => p.priceCents);

    return {
      categories: this.catalog.categories.map((c) => ({
        ...c,
        count: count("category", (p) => p.category.slug === c.slug),
      })),
      collections: this.releases().map((c) => ({
        slug: c.slug,
        name: c.name,
        number: c.number,
        tagline: c.tagline,
        count: count("collection", (p) => p.collection.slug === c.slug),
      })),
      colors: [...colors]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, color]) => ({
          name,
          ...color,
          count: count("color", (p) => p.colors.some((c) => c.name === name)),
        })),
      sizes: [...sizes]
        .sort((a, b) => rankSize(a, order) - rankSize(b, order))
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

  /**
   * Releases that have pieces on the site, newest first. A release with no pieces is never
   * listed, so menus and filters only offer collections that exist.
   */
  releases(): Release[] {
    return this.catalog.collections
      .map((c) => {
        const pieces = this.products.filter((p) => p.collection.slug === c.slug);
        return {
          ...c,
          pieces: pieces.length,
          releasedAt: pieces.reduce((max, p) => (p.releasedAt > max ? p.releasedAt : max), ""),
          status: pieces.some((p) => p.preview) ? ("preview" as const) : ("open" as const),
        };
      })
      .filter((r) => r.pieces > 0)
      .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt) || b.number.localeCompare(a.number));
  }

  /** The newest release: what "Latest Drop" points to. */
  latestRelease(): Release | null {
    return this.releases()[0] ?? null;
  }

  findBySlug(slug: string): ProductDetail | null {
    return this.products.find((p) => p.slug === slug) ?? null;
  }

  findVariants(skus: string[]): Map<string, VariantWithProduct> {
    const wanted = new Set(skus);
    const found = new Map<string, VariantWithProduct>();
    for (const p of this.products) {
      for (const v of p.variants) {
        if (wanted.has(v.sku)) found.set(v.sku, { variant: v, product: toSummary(p) });
      }
    }
    return found;
  }
}
