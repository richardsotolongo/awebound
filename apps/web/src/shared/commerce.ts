import { z } from "zod";
import { ProductImageSchema } from "./catalog";

export const MAX_LINE_QUANTITY = 10;

export const BagLineInputSchema = z.object({
  sku: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
  /**
   * What the shopper chose. A piece's SKUs change when it goes from preview to on sale (they
   * become Fourthwall's variant ids), so a line saved before that is found again by these.
   */
  productSlug: z.string().max(64).optional(),
  color: z.string().max(64).optional(),
  size: z.string().max(32).optional(),
});
export type BagLineInput = z.infer<typeof BagLineInputSchema>;

export const BagValidateRequestSchema = z.object({
  lines: z.array(BagLineInputSchema).max(50),
});
export type BagValidateRequest = z.infer<typeof BagValidateRequestSchema>;

export const BagLineSchema = z.object({
  sku: z.string(),
  productSlug: z.string(),
  code: z.string(),
  name: z.string(),
  cut: z.string(),
  color: z.string(),
  size: z.string(),
  image: ProductImageSchema,
  unitPriceCents: z.number().int(),
  quantity: z.number().int(),
  available: z.boolean(),
  /** The piece isn't published in Fourthwall yet, so checkout can't start with this line. */
  preview: z.boolean().default(false),
});
export type BagLine = z.infer<typeof BagLineSchema>;

export const BagIssueSchema = z.object({
  sku: z.string(),
  kind: z.enum(["not_found", "sold_out", "quantity_adjusted"]),
  message: z.string(),
});
export type BagIssue = z.infer<typeof BagIssueSchema>;

export const BagSchema = z.object({
  lines: z.array(BagLineSchema),
  subtotalCents: z.number().int(),
  currency: z.string().length(3),
  issues: z.array(BagIssueSchema),
});
export type Bag = z.infer<typeof BagSchema>;

export const CheckoutRequestSchema = z.object({
  lines: z.array(BagLineInputSchema).min(1).max(50),
});
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

/** Checkout outcome: the shopper is sent to Fourthwall's hosted checkout at `url`. */
export type CheckoutResult = { url: string };
