import { z } from "zod";

/** Product categories. The slug is the URL value; `cut` is how a single product names its cut. */
export const CATEGORY_SLUGS = ["tees", "oversized-tees", "tanks", "hats"] as const;
export const CategorySlugSchema = z.enum(CATEGORY_SLUGS);
export type CategorySlug = z.infer<typeof CategorySlugSchema>;

/** The three A3 families, one per brand pillar. */
export const COLLECTION_SLUGS = ["royal-heritage", "broken-bond", "rolled-away"] as const;
export const CollectionSlugSchema = z.enum(COLLECTION_SLUGS);
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

export const CollectionSchema = z.object({
  slug: CollectionSlugSchema,
  name: z.string(),
  /** Lookbook family letter: R, B or T. */
  familyCode: z.string().length(1),
  pillar: z.string(),
  story: z.string(),
  scriptureRef: z.string(),
});
export type Collection = z.infer<typeof CollectionSchema>;

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

export const ImageViewSchema = z.enum(["back", "front", "detail"]);
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
  /** Lookbook ID, e.g. A3-B01. */
  code: z.string(),
  slug: z.string(),
  name: z.string(),
  collection: CollectionSchema.pick({ slug: true, name: true, pillar: true }),
  category: CategorySchema,
  baseColor: z.string(),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  colors: z.array(ColorSchema),
  sizes: z.array(z.string()),
  scriptureRef: z.string(),
  image: ProductImageSchema,
  hoverImage: ProductImageSchema.nullable(),
  featured: z.boolean(),
  releasedAt: z.string(),
});
export type ProductSummary = z.infer<typeof ProductSummarySchema>;

/** Product copy, following the voice template in the brand skill. */
export const ProductStorySchema = z.object({
  /** One sentence on the back art and what it shows. */
  art: z.string(),
  front: z.string(),
  back: z.string(),
  inks: z.string(),
  /** One plain-language line about the referenced verse (never the verse text). */
  paraphrase: z.string(),
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
    CollectionSchema.pick({ slug: true, name: true, pillar: true }).extend(FacetCount.shape),
  ),
  colors: z.array(ColorSchema.extend(FacetCount.shape)),
  sizes: z.array(z.object({ size: z.string() }).extend(FacetCount.shape)),
  /** Whole dollars across the whole catalog. */
  price: z.object({ min: z.number().int(), max: z.number().int() }),
});
export type CatalogFacets = z.infer<typeof CatalogFacetsSchema>;
