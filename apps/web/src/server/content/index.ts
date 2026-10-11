import { z } from "zod";
import {
  CategorySchema,
  CollectionSchema,
  ImageViewSchema,
  ProductStorySchema,
  SizeGuideSchema,
  type Category,
  type Collection,
  type Color,
  type ProductImage,
  type ProductStory,
  type ScriptureQuote,
  type SizeGuide,
} from "@/shared";
import { quote, ScriptureRecordSchema } from "../scripture";
import raw from "./catalog.json";

const ContentImage = z.object({ view: ImageViewSchema, url: z.string(), alt: z.string() });

const BrandContentSchema = z.object({
  categories: z.array(
    CategorySchema.extend({
      /** Sizes a preview product offers until Fourthwall supplies the real ones. */
      sizes: z.array(z.string()).min(1),
    }),
  ),
  collections: z.array(CollectionSchema),
  colors: z.record(z.string(), z.string()),
  /** Garment measurements per blank, keyed by an id products refer to. */
  sizeGuides: z.record(
    z.string(),
    SizeGuideSchema.extend({
      /** The supplier product (brand, model, Fourthwall id), for our records; never shown. */
      blank: z.string(),
    }),
  ),
  products: z.array(
    z.object({
      code: z.string(),
      slug: z.string(),
      name: z.string(),
      collection: z.string(),
      category: z.string(),
      /** Order within the release, from 1. */
      position: z.number().int().positive(),
      colors: z.array(z.string()).min(1),
      /** The site's price while the product is a preview; Fourthwall's price wins once it's live. */
      priceCents: z.number().int().nonnegative(),
      /** Preview prices for sizes that cost more (2XL and up), matching Fourthwall. */
      sizePriceCents: z.record(z.string(), z.number().int().nonnegative()).optional(),
      featured: z.boolean(),
      releasedAt: z.string(),
      /** The piece's shared Scripture record (every translation the site can quote). */
      scripture: ScriptureRecordSchema,
      /** Product slug in the Fourthwall shop when it differs from `slug`. */
      fourthwallSlug: z.string().optional(),
      /** Key in `sizeGuides` for the product's blank. Its sizes are the sizes a preview offers. */
      sizeGuide: z.string().optional(),
      story: ProductStorySchema,
      /** Display order: listing image, hover image, then the rest. */
      images: z.array(ContentImage).min(1),
    }),
  ),
});

/** One design's brand story and images. Fourthwall supplies what can be bought: variants, prices, stock. */
export interface ProductContent {
  code: string;
  slug: string;
  name: string;
  /** Slug of the matching Fourthwall product (`slug` unless the content sets `fourthwallSlug`). */
  fourthwallSlug: string;
  collection: Collection;
  position: number;
  category: Category;
  /** Brand garment colors for the design; the first is the base color. */
  colors: Color[];
  /** Preview price and sizes, used until the product is in Fourthwall. */
  priceCents: number;
  /** Preview price per size where it differs from `priceCents`. */
  sizePriceCents: Record<string, number>;
  sizes: string[];
  /** Measurements for the product's blank, or null when there isn't a guide yet. */
  sizeGuide: SizeGuide | null;
  featured: boolean;
  releasedAt: string;
  /** The piece's verse in the website's translation. */
  scripture: ScriptureQuote;
  story: ProductStory;
  /** The site's styled product images (Fourthwall renders or mockups), in display order. */
  images: [ProductImage, ...ProductImage[]];
}

export interface BrandContent {
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

    const [first, ...rest] = p.images;
    if (!first) throw new Error(`${p.code}: needs at least one image`);

    let sizeGuide: SizeGuide | null = null;
    if (p.sizeGuide) {
      const found = content.sizeGuides[p.sizeGuide];
      if (!found) throw new Error(`${p.code}: unknown size guide ${p.sizeGuide}`);
      // `blank` stays on the server: the site never names the supplier.
      const guide: SizeGuide = SizeGuideSchema.parse(found);
      for (const row of guide.rows) {
        if (row.values.length !== guide.measures.length)
          throw new Error(`${p.sizeGuide}: ${row.size} needs ${guide.measures.length} values`);
      }
      sizeGuide = guide;
    }
    const sizes = sizeGuide ? sizeGuide.rows.map((r) => r.size) : category.sizes;
    for (const size of Object.keys(p.sizePriceCents ?? {})) {
      if (!sizes.includes(size)) throw new Error(`${p.code}: price for unknown size ${size}`);
    }

    return {
      code: p.code,
      slug: p.slug,
      name: p.name,
      fourthwallSlug: p.fourthwallSlug ?? p.slug,
      collection,
      position: p.position,
      category: { slug: category.slug, name: category.name, cut: category.cut },
      colors,
      priceCents: p.priceCents,
      sizePriceCents: p.sizePriceCents ?? {},
      sizes,
      sizeGuide,
      featured: p.featured,
      releasedAt: p.releasedAt,
      scripture: quote(p.scripture),
      story: p.story,
      images: [first, ...rest],
    };
  });

  return {
    categories: content.categories.map(({ slug, name, cut }) => ({ slug, name, cut })),
    collections: content.collections,
    colorTokens: content.colors,
    products,
  };
}

export const brandContent: BrandContent = loadBrandContent();
