import type { SupabaseClient } from "@supabase/supabase-js";
import { CatalogFacetsSchema, CollectionSchema, SIZE_ORDER } from "@awebound/shared";
import { z } from "zod";
import {
  toSummary,
  type CatalogFacets,
  type Collection,
  type ProductDetail,
  type ProductQuery,
  type VariantWithProduct,
} from "../../domain/catalog";
import { UnavailableError } from "../../domain/errors";
import type { ProductRepository, ProductSearchResult } from "../../application/ports";

const CollectionRow = z.object({
  slug: z.string(),
  name: z.string(),
  family_code: z.string(),
  pillar: z.string(),
  story: z.string(),
  scripture_ref: z.string(),
});

const ProductRow = z.object({
  code: z.string(),
  slug: z.string(),
  name: z.string(),
  price_cents: z.number(),
  currency: z.string(),
  scripture_ref: z.string(),
  story_art: z.string(),
  story_front: z.string(),
  story_back: z.string(),
  story_inks: z.string(),
  story_paraphrase: z.string(),
  story_fit: z.string(),
  story_material: z.string().nullable(),
  featured: z.boolean(),
  released_at: z.string(),
  collection: CollectionRow,
  category: z.object({ slug: z.string(), name: z.string(), cut: z.string() }),
  variants: z.array(
    z.object({
      sku: z.string(),
      color_name: z.string(),
      color_token: z.string(),
      color_rank: z.number(),
      size: z.string(),
      size_rank: z.number(),
      available: z.boolean(),
      price_cents: z.number().nullable(),
    }),
  ),
  images: z.array(
    z.object({ url: z.string(), alt: z.string(), view: z.enum(["back", "front", "detail"]), sort_order: z.number() }),
  ),
});
type ProductRow = z.infer<typeof ProductRow>;

const PRODUCT_SELECT = `
  code, slug, name, price_cents, currency, scripture_ref,
  story_art, story_front, story_back, story_inks, story_paraphrase, story_fit, story_material,
  featured, released_at,
  collection:collections!inner ( slug, name, family_code, pillar, story, scripture_ref ),
  category:categories!inner ( slug, name, cut ),
  variants:product_variants ( sku, color_name, color_token, color_rank, size, size_rank, available, price_cents ),
  images:product_images ( url, alt, view, sort_order )
`;

function toCollection(row: z.infer<typeof CollectionRow>): Collection {
  return CollectionSchema.parse({
    slug: row.slug,
    name: row.name,
    familyCode: row.family_code,
    pillar: row.pillar,
    story: row.story,
    scriptureRef: row.scripture_ref,
  });
}

function toProduct(row: ProductRow): ProductDetail {
  const order = SIZE_ORDER as readonly string[];
  const variants = [...row.variants].sort(
    (a, b) => a.color_rank - b.color_rank || a.color_name.localeCompare(b.color_name) || a.size_rank - b.size_rank,
  );
  const colors: { name: string; token: string }[] = [];
  for (const v of variants) {
    if (!colors.some((c) => c.name === v.color_name)) colors.push({ name: v.color_name, token: v.color_token });
  }
  const sizes = [...new Set(variants.map((v) => v.size))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const images = [...row.images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ url, alt, view }) => ({ url, alt, view }));
  const back = images.find((i) => i.view === "back") ?? images[0] ?? {
    url: "/products/placeholder.svg",
    alt: `${row.name}`,
    view: "back" as const,
  };
  const front = images.find((i) => i.view === "front") ?? null;

  return {
    code: row.code,
    slug: row.slug,
    name: row.name,
    collection: toCollection(row.collection),
    category: row.category as ProductDetail["category"],
    baseColor: colors[0]?.name ?? "",
    priceCents: row.price_cents,
    currency: row.currency,
    colors,
    sizes,
    scriptureRef: row.scripture_ref,
    image: back,
    hoverImage: front,
    featured: row.featured,
    releasedAt: row.released_at,
    story: {
      art: row.story_art,
      front: row.story_front,
      back: row.story_back,
      inks: row.story_inks,
      paraphrase: row.story_paraphrase,
      fit: row.story_fit,
      material: row.story_material,
    },
    images,
    variants: variants.map((v) => ({
      sku: v.sku,
      color: v.color_name,
      size: v.size,
      available: v.available,
      priceCents: v.price_cents ?? row.price_cents,
    })),
  };
}

function filterParams(query: ProductQuery) {
  return {
    p_q: query.q || null,
    p_categories: query.category ?? null,
    p_collections: query.collection ?? null,
    p_colors: query.color ?? null,
    p_sizes: query.size ?? null,
    p_min_cents: query.minPrice !== undefined ? query.minPrice * 100 : null,
    p_max_cents: query.maxPrice !== undefined ? query.maxPrice * 100 : null,
  };
}

/** Catalog backed by Supabase Postgres. Search, sort, paging and facets run in SQL (see migrations). */
export class SupabaseProductRepository implements ProductRepository {
  constructor(private readonly db: SupabaseClient) {}

  private fail(context: string, error: unknown): never {
    throw Object.assign(new UnavailableError("The shop is unreachable right now. Try again in a moment."), {
      cause: { context, error },
    });
  }

  private async loadProducts(column: "code" | "slug", values: string[]): Promise<ProductDetail[]> {
    if (values.length === 0) return [];
    const { data, error } = await this.db
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_published", true)
      .in(column, values);
    if (error) this.fail("products.select", error);
    return z.array(ProductRow).parse(data).map(toProduct);
  }

  async search(query: ProductQuery): Promise<ProductSearchResult> {
    const { data, error } = await this.db.rpc("search_products", {
      ...filterParams(query),
      p_sort: query.sort,
      p_limit: query.pageSize,
      p_offset: (query.page - 1) * query.pageSize,
    });
    if (error) this.fail("rpc.search_products", error);
    const rows = z.array(z.object({ product_id: z.string(), total_count: z.number() })).parse(data);
    if (rows.length === 0) {
      // Past the last page the window is empty; ask for the total without paging.
      return { items: [], total: query.page > 1 ? await this.count(query) : 0 };
    }

    const ids = rows.map((r) => r.product_id);
    const { data: products, error: loadError } = await this.db
      .from("products")
      .select(`id, ${PRODUCT_SELECT}`)
      .in("id", ids);
    if (loadError) this.fail("products.byIds", loadError);
    const byId = new Map(
      z
        .array(ProductRow.extend({ id: z.string() }))
        .parse(products)
        .map((row) => [row.id, toSummary(toProduct(row))]),
    );
    return {
      items: ids.map((id) => byId.get(id)).filter((p) => p !== undefined),
      total: rows[0]?.total_count ?? 0,
    };
  }

  private async count(query: ProductQuery): Promise<number> {
    const { data, error } = await this.db.rpc("search_products", {
      ...filterParams(query),
      p_sort: query.sort,
      p_limit: 1,
      p_offset: 0,
    });
    if (error) this.fail("rpc.search_products.count", error);
    return z.array(z.object({ total_count: z.number() })).parse(data)[0]?.total_count ?? 0;
  }

  async facets(query: ProductQuery): Promise<CatalogFacets> {
    const { data, error } = await this.db.rpc("catalog_facets", filterParams(query));
    if (error) this.fail("rpc.catalog_facets", error);
    return CatalogFacetsSchema.parse(data);
  }

  async findBySlug(slug: string): Promise<ProductDetail | null> {
    const [product] = await this.loadProducts("slug", [slug]);
    return product ?? null;
  }

  async findVariantsBySkus(skus: string[]): Promise<Map<string, VariantWithProduct>> {
    const found = new Map<string, VariantWithProduct>();
    if (skus.length === 0) return found;
    const { data, error } = await this.db.from("product_variants").select("sku, product:products!inner(code)").in("sku", skus);
    if (error) this.fail("variants.bySku", error);
    const codes = [
      ...new Set(z.array(z.object({ product: z.object({ code: z.string() }) })).parse(data).map((r) => r.product.code)),
    ];
    const wanted = new Set(skus);
    for (const product of await this.loadProducts("code", codes)) {
      const summary = toSummary(product);
      for (const variant of product.variants) {
        if (wanted.has(variant.sku)) found.set(variant.sku, { variant, product: summary });
      }
    }
    return found;
  }

  async listCollections(): Promise<Collection[]> {
    const { data, error } = await this.db
      .from("collections")
      .select("slug, name, family_code, pillar, story, scripture_ref")
      .order("sort_order");
    if (error) this.fail("collections.select", error);
    return z.array(CollectionRow).parse(data).map(toCollection);
  }
}
