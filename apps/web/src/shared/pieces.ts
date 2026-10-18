import { z } from "zod";
import {
  ImageViewSchema,
  MediaSchema,
  PlateSchema,
  ProductStorySchema,
  ScriptureRecordSchema,
  SizeGuideSchema,
} from "./catalog";

/**
 * The catalog's own shapes: a piece and a size guide as catalog.json holds them, which is also how
 * a piece zip carries them and what the database rows map to. Shared so the owner's import page
 * can read a zip in the browser.
 */

export const SlugSchema = z
  .string()
  .regex(/^[a-z0-9-]{1,64}$/, "Use lowercase letters, digits and dashes.");

export const ContentImageSchema = z.object({
  view: ImageViewSchema,
  url: z.string().min(1),
  alt: z.string(),
});

export const SizeGuideContentSchema = SizeGuideSchema.extend({
  /** The supplier product (brand, model, Fourthwall id), for our records; never shown. */
  blank: z.string(),
});
export type SizeGuideContent = z.infer<typeof SizeGuideContentSchema>;

export const PieceContentSchema = z.object({
  code: z.string().min(1).max(40),
  slug: SlugSchema,
  name: z.string().min(1).max(80),
  collection: SlugSchema,
  category: z.string(),
  /** Order within the release, from 1. */
  position: z.number().int().positive(),
  colors: z.array(z.string().min(1)).min(1),
  /** The site's price while the product is a preview; Fourthwall's price wins once it's live. */
  priceCents: z.number().int().nonnegative(),
  /** Preview prices for sizes that cost more (2XL and up), matching Fourthwall. */
  sizePriceCents: z.record(z.string(), z.number().int().nonnegative()).optional(),
  featured: z.boolean(),
  releasedAt: z.string(),
  /** The piece's shared Scripture record (every translation the site can quote). */
  scripture: ScriptureRecordSchema,
  /** Product slug in the Fourthwall shop when it differs from `slug`. */
  fourthwallSlug: z.string().min(1).optional(),
  /** The Fourthwall offer id its orders arrive under. */
  fourthwallOfferId: z.string().min(1).max(80).optional(),
  /** Key of the size guide for the product's blank. Its sizes are the sizes a preview offers. */
  sizeGuide: z.string().optional(),
  story: ProductStorySchema,
  /** Display order: listing image, hover image, then the rest. */
  images: z.array(ContentImageSchema).min(1),
  /** The piece's surface (plate-wide, plate-tall and piece.webp beside its images). */
  plate: PlateSchema.optional(),
  /** Close-up, cut-out and plate images; Behold's sit beside its gallery in public/products. */
  media: MediaSchema.optional(),
});
export type PieceContent = z.infer<typeof PieceContentSchema>;

/** piece.json in a piece zip: a catalog piece, its Fourthwall ids, images relative to the zip. */
export const PieceJsonSchema = PieceContentSchema.extend({
  releasedAt: z.string().optional(),
  status: z.literal("draft").optional(),
});
export type PieceJson = z.infer<typeof PieceJsonSchema>;

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-01.");

// Owner actions

export const CollectionFieldsSchema = z.object({
  slug: SlugSchema,
  name: z.string().trim().min(1, "Name the collection.").max(80),
  number: z.string().trim().min(1, "Give it a number, like 02.").max(10),
  tagline: z.string().trim().max(300),
  story: z.string().trim().max(3000),
  scriptureRef: z.string().trim().max(120),
  releasedAt: z.union([z.literal(""), IsoDate]),
  position: z.number().int().min(1).max(999),
});
export type CollectionFields = z.infer<typeof CollectionFieldsSchema>;
/** `slug` null creates a collection. */
export const SaveCollectionRequestSchema = z.object({
  slug: SlugSchema.nullable(),
  fields: CollectionFieldsSchema,
});
export const CollectionRequestSchema = z.object({ slug: SlugSchema });
export const ReorderPiecesRequestSchema = z.object({
  collection: SlugSchema,
  pieces: z.array(SlugSchema).min(1).max(100),
});

export const PIECE_STATUSES = ["draft", "in_review", "published"] as const;
export type PieceStatus = (typeof PIECE_STATUSES)[number];

const text = (max: number) => z.string().trim().max(max);
const cents = z.number().int().min(0).max(100_000);

/** What the review page can change on a piece; each form sends only its own fields. */
export const PiecePatchSchema = z
  .object({
    name: text(80).min(1, "Name the piece."),
    code: text(40).min(1, "Give it its internal code."),
    category: z.string().min(1),
    colors: z.array(text(60).min(1)).min(1, "Name at least one color.").max(12),
    priceCents: cents,
    sizePriceCents: z.record(z.string(), cents),
    featured: z.boolean(),
    scripture: z.object({
      reference: text(120).min(1, "Give the Scripture reference."),
      excerpt: z.boolean(),
      kjv: text(1000).min(1, "Give the King James text."),
      niv: text(1000),
    }),
    story: z.object({
      theme: text(60),
      call: text(120),
      art: text(500),
      meaning: text(3000),
      front: text(300),
      back: text(300),
      inks: text(200),
      fit: text(200),
      material: text(300).nullable(),
      process: z.enum(["printed", "embroidered"]),
    }),
    plate: PlateSchema.nullable(),
    images: z.array(ContentImageSchema).min(1).max(12),
    fourthwallSlug: text(120).min(1, "Give the Fourthwall product slug."),
    /** Empty clears it. */
    fourthwallOfferId: text(80),
    sizeGuideId: SlugSchema.nullable(),
  })
  .partial();
export type PiecePatch = z.infer<typeof PiecePatchSchema>;
export const EditPieceRequestSchema = z.object({ slug: SlugSchema, patch: PiecePatchSchema });
export const PieceRequestSchema = z.object({ slug: SlugSchema });
export const PublishPieceRequestSchema = z.object({
  slug: SlugSchema,
  archive: z.boolean(),
  wallpapers: z.boolean(),
});

/** A size guide as the owner edits it; its image is replaced on its own. */
export const SizeGuideFieldsSchema = z.object({
  name: text(120).min(1, "Name the guide."),
  blank: text(300),
  fit: text(300).nullable(),
  note: text(300).nullable(),
  tolerance: text(300).nullable(),
  measures: z
    .array(z.object({ label: text(40).min(1), how: text(200) }))
    .min(1)
    .max(8),
  rows: z
    .array(z.object({ size: text(20).min(1), values: z.array(text(20)) }))
    .min(1)
    .max(12),
});
export type SizeGuideFields = z.infer<typeof SizeGuideFieldsSchema>;
export const SaveSizeGuideRequestSchema = z.object({
  id: SlugSchema,
  fields: SizeGuideFieldsSchema,
});

export const PIECE_IMAGE_SLOTS = ["gallery", "detail", "piece", "plateWide", "plateTall"] as const;
export type PieceImageSlot = (typeof PIECE_IMAGE_SLOTS)[number];
/** The image being replaced: one of a piece's, a size guide's, or a collection's cover or plate. */
export const ImageTargetSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("piece"),
    slug: SlugSchema,
    slot: z.enum(PIECE_IMAGE_SLOTS),
    index: z.number().int().min(0).max(11).default(0),
  }),
  z.object({ kind: z.literal("guide"), id: SlugSchema }),
  z.object({ kind: z.literal("collection"), slug: SlugSchema, slot: z.enum(["cover", "plate"]) }),
]);
export type ImageTarget = z.input<typeof ImageTargetSchema>;
export const ImageUploadRequestSchema = z.object({
  target: ImageTargetSchema,
  fileName: z
    .string()
    .regex(/^[\w.-]{1,120}\.(webp|png|jpe?g)$/i, "Choose a WebP, PNG or JPEG image."),
});
export const ImageRegisterRequestSchema = z.object({
  target: ImageTargetSchema,
  path: z.string().regex(/^uploads\/[0-9a-f-]{36}\.(webp|png|jpe?g)$/i),
});

export const ImportCreateRequestSchema = z.object({
  fileName: z.string().regex(/^[\w.-]{1,160}\.zip$/i, "Choose the piece’s .zip file."),
});
export const ImportCollectionSchema = z.union([
  z.object({ existing: SlugSchema }),
  z.object({ create: CollectionFieldsSchema }),
]);
export type ImportCollection = z.infer<typeof ImportCollectionSchema>;
export const ImportRequestSchema = z.object({
  importId: z.uuid(),
  collection: ImportCollectionSchema,
});

/** What a check of a piece zip found: errors stop the import, warnings don't. */
export interface ZipReport {
  errors: string[];
  warnings: string[];
  piece: { slug: string; name: string; code: string; collection: string } | null;
}
