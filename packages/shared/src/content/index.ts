import { z } from "zod";
import {
  CategorySchema,
  CollectionSchema,
  ProductStorySchema,
  type Category,
  type Collection,
  type Color,
  type ProductImage,
  type ProductStory,
} from "../catalog";
import raw from "./catalog.json";

const ContentImage = z.object({ url: z.string(), alt: z.string() });

const BrandContentSchema = z.object({
  currency: z.string().length(3),
  categories: z.array(CategorySchema),
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
      featured: z.boolean(),
      releasedAt: z.string(),
      scriptureRef: z.string(),
      /** Product slug in the Fourthwall shop when it differs from `slug`. */
      fourthwallSlug: z.string().optional(),
      story: ProductStorySchema,
      images: z.object({ back: ContentImage, front: ContentImage }),
    }),
  ),
});

/** One design's brand story. Fourthwall supplies what can be bought: variants, prices, stock, photos. */
export interface ProductContent {
  code: string;
  slug: string;
  name: string;
  /** Slug of the matching Fourthwall product (`slug` unless the content sets `fourthwallSlug`). */
  fourthwallSlug: string;
  collection: Collection;
  category: Category;
  /** Brand garment colors for the design; the first is the base color. */
  colors: Color[];
  featured: boolean;
  releasedAt: string;
  scriptureRef: string;
  story: ProductStory;
  /** Sample art (back, front), shown when the Fourthwall product has no photos. */
  images: [ProductImage, ProductImage];
}

export interface BrandContent {
  currency: string;
  categories: Category[];
  collections: Collection[];
  /** Garment color name → brand token, for matching Fourthwall color names. */
  colorTokens: Record<string, string>;
  products: ProductContent[];
}

/** Parses catalog.json and resolves each product's collection, category and colors. */
function loadBrandContent(): BrandContent {
  const content = BrandContentSchema.parse(raw);

  const products = content.products.map((p): ProductContent => {
    const category = content.categories.find((c) => c.slug === p.category);
    const collection = content.collections.find((c) => c.slug === p.collection);
    if (!category) throw new Error(`${p.code}: unknown category ${p.category}`);
    if (!collection) throw new Error(`${p.code}: unknown collection ${p.collection}`);
    const colors = p.colors.map((name) => {
      const token = content.colors[name];
      if (!token) throw new Error(`${p.code}: unknown color ${name}`);
      return { name, token };
    });

    return {
      code: p.code,
      slug: p.slug,
      name: p.name,
      fourthwallSlug: p.fourthwallSlug ?? p.slug,
      collection,
      category,
      colors,
      featured: p.featured,
      releasedAt: p.releasedAt,
      scriptureRef: p.scriptureRef,
      story: p.story,
      images: [
        { ...p.images.back, view: "back" },
        { ...p.images.front, view: "front" },
      ],
    };
  });

  return {
    currency: content.currency,
    categories: content.categories,
    collections: content.collections,
    colorTokens: content.colors,
    products,
  };
}

export const brandContent: BrandContent = loadBrandContent();
