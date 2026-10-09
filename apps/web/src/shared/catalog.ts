import { z } from "zod";

/** Product categories. The slug is the URL value; `cut` is how a single product names its cut. */
export const CATEGORY_SLUGS = ["tees", "oversized-tees", "tanks", "hats"] as const;
export const CategorySlugSchema = z.enum(CATEGORY_SLUGS);
export type CategorySlug = z.infer<typeof CategorySlugSchema>;

/** Release slugs are free-form so a new release needs no code change (the first is "behold"). */
export const CollectionSlugSchema = z.string().regex(/^[a-z0-9-]+$/);
export type CollectionSlug = z.infer<typeof CollectionSlugSchema>;

export const SORT_OPTIONS = ["featured", "newest", "price-asc", "price-desc", "name"] as const;
export const SortSchema = z.enum(SORT_OPTIONS);
export type Sort = z.infer<typeof SortSchema>;

export const SORT_LABELS: Record<Sort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
  name: "Name",
};

/** Apparel sizes in display order. Caps are "One size". */
export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "One size"] as const;

export const CategorySchema = z.object({
  slug: CategorySlugSchema,
  name: z.string(),
  /** Singular cut label used on product pages: "Tee", "Oversized tee", "Tank", "Cap". */
  cut: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

/** Translations the website can quote. Printed garment art keeps its own wording. */
export const TRANSLATIONS = ["NIV", "KJV"] as const;
export type Translation = (typeof TRANSLATIONS)[number];

/**
 * A Scripture quotation as the website shows it: exact wording in one translation, its full
 * reference, and whether it is part of a verse. Resolved on the server from the content's shared
 * Scripture record, so the home page, shop and product page always agree.
 */
export const ScriptureQuoteSchema = z.object({
  /** Exact wording and punctuation; no surrounding quotation marks. */
  text: z.string(),
  reference: z.string(),
  translation: z.enum(TRANSLATIONS),
  /** True when the quote is part of the verse; shown as "NIV, excerpt". */
  excerpt: z.boolean(),
});
export type ScriptureQuote = z.infer<typeof ScriptureQuoteSchema>;

/**
 * A release: the pieces that drop together under one name and one call. The site launches with a
 * single release, Behold. (Kept as "collection" in code.)
 */
export const CollectionSchema = z.object({
  slug: CollectionSlugSchema,
  name: z.string(),
  /** Release number as shown: "01". */
  number: z.string(),
  /** One line under the name: what the release calls people to see. */
  tagline: z.string(),
  /** A short introduction: the theme and its connection to Scripture. */
  story: z.string(),
  scriptureRef: z.string(),
});
export type Collection = z.infer<typeof CollectionSchema>;

/** Collection filter values beside real release slugs. No value means the latest drop. */
export const LATEST_DROP = "latest";
export const ALL_COLLECTIONS = "all";

/**
 * A release as the site lists it. `status` is "preview" until every piece can be ordered, which
 * switches the release-status labels and preview messages across the site.
 */
export const ReleaseSchema = CollectionSchema.extend({
  pieces: z.number().int(),
  releasedAt: z.string(),
  status: z.enum(["preview", "open"]),
});
export type Release = z.infer<typeof ReleaseSchema>;

export const ColorSchema = z.object({
  name: z.string(),
  /** Brand token without the leading dashes, e.g. "garment-faded-black". Empty when unknown. */
  token: z.string(),
  /** The provider's own swatch (hex), used only when no brand token matches the color name. */
  swatch: z.string().optional(),
});
export type Color = z.infer<typeof ColorSchema>;

/** CSS value for a color chip: the brand token when there is one, else the provider's swatch. */
export function colorCss(color: Pick<Color, "token" | "swatch">): string {
  if (color.token) return `var(--${color.token})`;
  return color.swatch && /^#[0-9a-fA-F]{3,8}$/.test(color.swatch) ? color.swatch : "transparent";
}

export const ImageViewSchema = z.enum(["back", "front", "side", "detail"]);
export const ProductImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  view: ImageViewSchema,
});
export type ProductImage = z.infer<typeof ProductImageSchema>;

export const VariantSchema = z.object({
  sku: z.string(),
  color: z.string(),
  size: z.string(),
  available: z.boolean(),
  priceCents: z.number().int().nonnegative(),
});
export type Variant = z.infer<typeof VariantSchema>;

export const ProductSummarySchema = z.object({
  /**
   * Internal design ID, e.g. A3-B01 (hats use H: A3-H01). Kept for records, SKUs and orders;
   * never shown to customers.
   */
  code: z.string(),
  slug: z.string(),
  name: z.string(),
  collection: CollectionSchema.pick({ slug: true, name: true, number: true, tagline: true }),
  /** Order within its release, from 1. Drives the default sort and the I–VI numbering. */
  position: z.number().int().positive(),
  /**
   * True while the piece is on the site but not yet in Fourthwall: it shows with the site's price
   * and mockups, and checkout says it opens soon.
   */
  preview: z.boolean(),
  category: CategorySchema,
  baseColor: z.string(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  colors: z.array(ColorSchema),
  sizes: z.array(z.string()),
  scripture: ScriptureQuoteSchema,
  image: ProductImageSchema,
  hoverImage: ProductImageSchema.nullable(),
  featured: z.boolean(),
  releasedAt: z.string(),
});
export type ProductSummary = z.infer<typeof ProductSummarySchema>;

export const MOTIF_NAMES = ["ground", "sea", "rays", "bloom", "stone", "hourglass"] as const;
export type MotifName = (typeof MOTIF_NAMES)[number];

/** Product copy, following the voice template in the brand skill. */
export const ProductStorySchema = z.object({
  /** What the piece calls people to see, in one word: "Holiness". */
  theme: z.string(),
  /** The design story's headline: "Behold His holiness". */
  call: z.string(),
  /** Line art drawn behind the piece when it is featured on the home page. */
  motif: z.enum(MOTIF_NAMES),
  /** One sentence on the main art and what it shows. */
  art: z.string(),
  /** The full explanation: the moment in Scripture and how the artwork carries it. */
  meaning: z.string(),
  front: z.string(),
  back: z.string(),
  inks: z.string(),
  /** Cut details, e.g. "Oversized tee · dropped shoulder, boxy body". */
  fit: z.string(),
  /** Fabric, once the blank supplier is confirmed. */
  material: z.string().nullable(),
});
export type ProductStory = z.infer<typeof ProductStorySchema>;

export const ProductDetailSchema = ProductSummarySchema.extend({
  story: ProductStorySchema,
  images: z.array(ProductImageSchema),
  variants: z.array(VariantSchema),
  collection: CollectionSchema,
});
export type ProductDetail = z.infer<typeof ProductDetailSchema>;

const csvList = <T extends z.ZodType>(item: T) =>
  z.preprocess((value) => {
    if (value === undefined || value === "") return undefined;
    const raw = Array.isArray(value) ? value : [value];
    return raw
      .flatMap((v) => String(v).split(","))
      .map((v) => v.trim())
      .filter(Boolean);
  }, z.array(item).optional());

const optionalNumber = z.preprocess(
  (v) => (v === undefined || v === "" ? undefined : Number(v)),
  z.number().int().nonnegative().optional(),
);

/** Query for the shop listing. Values arrive from the URL, so lists accept comma-separated strings. */
export const ProductQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: csvList(CategorySlugSchema),
  collection: csvList(CollectionSlugSchema),
  color: csvList(z.string()),
  size: csvList(z.string()),
  /** Whole dollars. */
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  sort: SortSchema.default("featured"),
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? undefined : Number(v)),
    z.number().int().min(1).default(1),
  ),
  pageSize: z.preprocess(
    (v) => (v === undefined || v === "" ? undefined : Number(v)),
    z.number().int().min(1).max(48).default(12),
  ),
});
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type ProductQueryInput = z.input<typeof ProductQuerySchema>;

/** Serializes a query object; arrays become comma-separated values. */
export function toSearchParams(query: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  return params;
}

export const ProductListSchema = z.object({
  items: z.array(ProductSummarySchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  hasMore: z.boolean(),
});
export type ProductList = z.infer<typeof ProductListSchema>;

const FacetCount = z.object({ count: z.number().int() });

export const CatalogFacetsSchema = z.object({
  categories: z.array(CategorySchema.extend(FacetCount.shape)),
  collections: z.array(
    CollectionSchema.pick({ slug: true, name: true, number: true, tagline: true }).extend(
      FacetCount.shape,
    ),
  ),
  colors: z.array(ColorSchema.extend(FacetCount.shape)),
  sizes: z.array(z.object({ size: z.string() }).extend(FacetCount.shape)),
  /** Whole dollars across the whole catalog. */
  price: z.object({ min: z.number().int(), max: z.number().int() }),
});
export type CatalogFacets = z.infer<typeof CatalogFacetsSchema>;
