import { z } from "zod";
import {
  CategorySchema,
  CollectionSchema,
  ProductStorySchema,
  SIZE_ORDER,
  type Category,
  type Collection,
  type ProductDetail,
} from "../catalog";
import raw from "./catalog.json";

const SeedImage = z.object({ url: z.string(), alt: z.string() });

const CatalogSeedSchema = z.object({
  currency: z.string().length(3),
  categories: z.array(
    CategorySchema.extend({
      placeholderPriceCents: z.number().int(),
      sizes: z.array(z.string()),
    }),
  ),
  collections: z.array(CollectionSchema),
  colors: z.record(z.string(), z.string()),
  products: z.array(
    z.object({
      code: z.string(),
      slug: z.string(),
      name: z.string(),
      collection: z.string(),
      category: z.string(),
      colors: z.array(z.string()).min(1),
      soldOut: z.array(z.tuple([z.string(), z.string()])).optional(),
      priceCents: z.number().int().optional(),
      featured: z.boolean(),
      releasedAt: z.string(),
      scriptureRef: z.string(),
      story: ProductStorySchema,
      images: z.object({ back: SeedImage, front: SeedImage }),
    }),
  ),
});

export type CatalogSeed = z.infer<typeof CatalogSeedSchema>;

export interface SeedCatalog {
  currency: string;
  categories: Category[];
  collections: Collection[];
  products: ProductDetail[];
}

function slugPart(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** SKU format: A3-T02-WASHED-COAL-XL. Stable across the seed and Supabase, so bags survive a switch. */
export function skuFor(code: string, color: string, size: string): string {
  return `${code}-${slugPart(color)}-${slugPart(size)}`;
}

function sortSizes(sizes: string[]): string[] {
  const order = SIZE_ORDER as readonly string[];
  return [...sizes].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** Builds full product records (variants included) from the JSON seed. */
export function buildSeedCatalog(input: unknown = raw): SeedCatalog {
  const seed = CatalogSeedSchema.parse(input);
  const categories: Category[] = seed.categories.map(({ slug, name, cut }) => ({ slug, name, cut }));
  const collections = seed.collections;

  const products: ProductDetail[] = seed.products.map((p) => {
    const category = seed.categories.find((c) => c.slug === p.category);
    const collection = collections.find((c) => c.slug === p.collection);
    if (!category) throw new Error(`${p.code}: unknown category ${p.category}`);
    if (!collection) throw new Error(`${p.code}: unknown collection ${p.collection}`);

    const priceCents = p.priceCents ?? category.placeholderPriceCents;
    const sizes = sortSizes(category.sizes);
    const colors = p.colors.map((name) => {
      const token = seed.colors[name];
      if (!token) throw new Error(`${p.code}: unknown color ${name}`);
      return { name, token };
    });
    const soldOut = new Set((p.soldOut ?? []).map(([c, s]) => `${c}|${s}`));
    const variants = colors.flatMap((color) =>
      sizes.map((size) => ({
        sku: skuFor(p.code, color.name, size),
        color: color.name,
        size,
        available: !soldOut.has(`${color.name}|${size}`),
        priceCents,
      })),
    );
    const back = { ...p.images.back, view: "back" as const };
    const front = { ...p.images.front, view: "front" as const };
    const firstColor = colors[0];
    if (!firstColor) throw new Error(`${p.code}: needs at least one color`);

    return {
      code: p.code,
      slug: p.slug,
      name: p.name,
      collection,
      category: { slug: category.slug, name: category.name, cut: category.cut },
      baseColor: firstColor.name,
      priceCents,
      currency: seed.currency,
      colors,
      sizes,
      scriptureRef: p.scriptureRef,
      image: back,
      hoverImage: front,
      featured: p.featured,
      releasedAt: p.releasedAt,
      story: p.story,
      images: [back, front],
      variants,
    };
  });

  return { currency: seed.currency, categories, collections, products };
}

export const seedCatalog: SeedCatalog = buildSeedCatalog();
