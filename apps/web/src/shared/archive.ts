import { z } from "zod";

/** Schemas and types for My Archive shared by the server and the browser. No content lives here. */

export const FLAG_KEYS = [
  "archive.orders",
  "archive.claims",
  "archive.founding",
  "archive.wallpapers",
  "archive.pdf",
  "archive.share",
  "email.preferences_ui",
  "email.welcome",
  "email.unlock",
  "email.collection_updates",
  "email.guest_follow_up",
  "email.cart_reminder",
] as const;
export type FlagKey = (typeof FLAG_KEYS)[number];

export const ProductSlugSchema = z.string().regex(/^[a-z0-9-]{1,64}$/, "Unknown piece.");
export const DesignKeySchema = z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/, "Unknown design.");
export const AssetFormatSchema = z.enum(["phone", "desktop"]);
export type AssetFormat = z.infer<typeof AssetFormatSchema>;
export const ShareFormatSchema = z.enum(["portrait", "square"]);
export type ShareFormat = z.infer<typeof ShareFormatSchema>;
export const ConsentTopicSchema = z.enum(["collection_updates", "cart_reminders"]);
export type ConsentTopic = z.infer<typeof ConsentTopicSchema>;

// Shopper actions
export const SavePieceRequestSchema = z.object({ slug: ProductSlugSchema });
export type SavePieceRequest = z.infer<typeof SavePieceRequestSchema>;
export const DesignAccessRequestSchema = z.object({ slug: ProductSlugSchema });
export type DesignAccessRequest = z.infer<typeof DesignAccessRequestSchema>;
export const ClaimStartRequestSchema = z.object({
  friendlyId: z
    .string()
    .trim()
    .min(3, "Enter the order number.")
    .max(40, "That isn't an order number."),
});
export type ClaimStartRequest = z.infer<typeof ClaimStartRequestSchema>;
export const ClaimVerifyRequestSchema = z.object({
  claimId: z.uuid(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});
export type ClaimVerifyRequest = z.infer<typeof ClaimVerifyRequestSchema>;
export const ConsentRequestSchema = z.object({ topic: ConsentTopicSchema, consented: z.boolean() });
export type ConsentRequest = z.infer<typeof ConsentRequestSchema>;
/** The cart ids a browser kept after checking out as a guest. */
export const GuestOrderRequestSchema = z.object({
  cartIds: z.array(z.string().min(1).max(100)).min(1).max(5),
});
export type GuestOrderRequest = z.infer<typeof GuestOrderRequestSchema>;

// Owner actions
export const DraftFieldsSchema = z.object({
  publicPreview: z.string().trim().max(300),
  biblicalContext: z.string().trim().max(1500),
  contextReference: z.string().trim().max(120),
  bibleUrl: z.union([z.literal(""), z.url()]),
  additionalBibleUrls: z.array(z.url()).max(5),
  designStory: z.string().trim().max(3000),
  imageryMeaning: z.string().trim().max(2000),
  founderNote: z.string().trim().max(2000),
  shareCopy: z.string().trim().max(200),
  notes: z.string().trim().max(1000),
});
export type DraftFields = z.infer<typeof DraftFieldsSchema>;
export const SaveDraftRequestSchema = z.object({
  designKey: DesignKeySchema,
  fields: DraftFieldsSchema,
});
export const ApproveRequestSchema = z.object({
  designKey: DesignKeySchema,
  founderNoteReviewed: z.literal(true, "Confirm you have reviewed the founder note."),
});
export const PublishRequestSchema = z.object({
  designKeys: z.array(DesignKeySchema).min(1).max(10),
});
export const DesignKeyRequestSchema = z.object({ designKey: DesignKeySchema });
export const CareRequestSchema = z.object({
  designKey: DesignKeySchema,
  instructions: z.string().trim().min(1, "Enter the care instructions.").max(1000),
  source: z.string().trim().min(1, "Say where they come from.").max(200),
});
export const AssetUploadRequestSchema = z.object({
  designKey: DesignKeySchema.nullable(),
  format: AssetFormatSchema,
  fileName: z.string().regex(/^[\w.-]{1,120}\.(png|jpe?g)$/i, "Choose a PNG file."),
});
export const AssetRegisterRequestSchema = z.object({
  designKey: DesignKeySchema.nullable(),
  format: AssetFormatSchema,
  path: z.string().min(1).max(300),
  title: z.string().trim().min(1, "Give the file a title.").max(120),
});
export const AssetIdRequestSchema = z.object({ assetId: z.uuid() });
export const AssetAssignRequestSchema = z.object({ assetId: z.uuid(), designKey: DesignKeySchema });
export const FlagRequestSchema = z.object({
  key: z.enum(FLAG_KEYS),
  enabled: z.boolean(),
  note: z.string().trim().max(200).optional(),
});
export const OrderAdjustRequestSchema = z.object({
  orderId: z.string().min(1).max(80),
  lines: z
    .array(
      z.object({
        lineId: z.string().min(1).max(200),
        eligibleQuantity: z.number().int().min(0).max(100),
      }),
    )
    .min(1)
    .max(50),
  reason: z.string().trim().min(3, "Say why.").max(300),
});
export const OrderRelinkRequestSchema = z.object({
  orderId: z.string().min(1).max(80),
  userId: z.uuid().nullable(),
  reason: z.string().trim().min(3, "Say why.").max(300),
});
export const OrderIdRequestSchema = z.object({ orderId: z.string().min(1).max(80) });
export const MapOfferRequestSchema = z.object({
  designKey: DesignKeySchema,
  offerId: z.string().trim().min(1).max(80),
});
export const FoundingCorrectionRequestSchema = z.object({
  userId: z.uuid(),
  action: z.enum(["revoke", "restore", "award"]),
  reason: z.string().trim().min(3, "Say why.").max(300),
  orderId: z.string().max(80).optional(),
});

/** The owner's note to Founding Members; a test goes only to the owner. */
export const FoundingNoteRequestSchema = z.object({
  subject: z.string().trim().min(3, "Add a subject.").max(150),
  body: z.string().trim().min(10, "Write the note.").max(5000),
  test: z.boolean(),
});
export type FoundingNoteRequest = z.infer<typeof FoundingNoteRequestSchema>;

// What pages and components receive

/** The published, public part of a design's card: what anyone may read. */
export interface PublicCard {
  designKey: string;
  slug: string;
  name: string;
  collection: { slug: string; name: string };
  scriptureReference: string;
  contextReference: string;
  bibleUrl: string;
  additionalBibleUrls: string[];
  publicPreview: string;
  biblicalContext: string;
  publishedAt: string;
}

export type OwnedExtra =
  | {
      format: AssetFormat;
      status: "published";
      id: string;
      title: string;
      width: number;
      height: number;
    }
  | { format: AssetFormat; status: "preparing" };

/** The purchased part: only for an account that owns the design. */
export interface OwnedCard extends PublicCard {
  designStory: string;
  imageryMeaning: string;
  founderNote: string;
  care: { status: "verified"; instructions: string } | { status: "unconfirmed" };
  entitlement: {
    quantity: number;
    firstPaidAt: string | null;
    variants: { color: string | null; size: string | null; quantity: number }[];
  };
  extras: OwnedExtra[];
  exports: { pdf: boolean; share: boolean };
  shareCopy: string;
}

export interface SavedPiece {
  slug: string;
  savedAt: string;
  /** Null when the piece has left the catalog. */
  piece: {
    name: string;
    cut: string;
    color: string;
    image: { url: string; alt: string };
    status: string | null;
  } | null;
}

export interface OrderSummary {
  id: string;
  friendlyId: string | null;
  placedAt: string | null;
  sync: "confirmed" | "pending" | "revoked";
  lines: {
    slug: string | null;
    name: string;
    cut: string | null;
    color: string | null;
    size: string | null;
    quantity: number;
    /** The garment's listing image. */
    image: string | null;
  }[];
}
