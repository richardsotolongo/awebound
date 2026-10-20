import { z } from "zod";

/**
 * Idea Submissions in My Archive: the rules, shared by the server (which enforces them) and the
 * browser (which explains them). A purchase is one paid order linked to the account and not fully
 * refunded or cancelled; signing in is what lets the orders be counted.
 */

/** Purchases that open the first submission, then purchases for each one after it. */
export const IDEA_FIRST_AT = 5;
export const IDEA_EVERY = 3;

/** Submitted images: PNG or JPEG up to 10 MB (the bucket's own limit, in the migration). */
export const IDEA_MAX_BYTES = 10 * 1024 * 1024;

export interface IdeaAllowance {
  purchases: number;
  used: number;
  /** Submissions the purchases allow in total. */
  allowed: number;
  /** Submissions open right now. */
  remaining: number;
  unlocked: boolean;
  /** Total purchases at which the next submission opens, and how many more that takes. */
  nextAt: number;
  toNext: number;
  /** The owner can always send one, to see the form working; it isn't counted. */
  owner: boolean;
  /**
   * A Founding Member sends ideas without more purchases, one waiting for review at a time: the
   * next opens once the owner has reviewed the last (the owner's choice, October 2026).
   */
  founding: boolean;
  /** The seal is an honorary one from the owner (same rules, worded as honorary). */
  honorary: boolean;
  /** The account's ideas still waiting for review (new or being reviewed). */
  waiting: number;
}

/**
 * 5 purchases open the first submission; every 3 more open another. A Founding Member has one open
 * whenever nothing is waiting for review.
 */
export function ideaAllowance(
  purchases: number,
  used: number,
  owner = false,
  founding: { waiting: number; honorary?: boolean } | null = null,
): IdeaAllowance {
  const allowed =
    purchases < IDEA_FIRST_AT ? 0 : 1 + Math.floor((purchases - IDEA_FIRST_AT) / IDEA_EVERY);
  const nextAt = IDEA_FIRST_AT + IDEA_EVERY * used;
  return {
    purchases,
    used,
    allowed,
    remaining: owner ? 1 : founding ? (founding.waiting > 0 ? 0 : 1) : Math.max(0, allowed - used),
    unlocked: owner || Boolean(founding) || purchases >= IDEA_FIRST_AT,
    nextAt,
    toNext: Math.max(0, nextAt - purchases),
    owner,
    founding: Boolean(founding),
    honorary: Boolean(founding?.honorary),
    waiting: founding?.waiting ?? 0,
  };
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const IDEA_STATUSES = ["new", "reviewing", "selected", "declined"] as const;
export const IdeaStatusSchema = z.enum(IDEA_STATUSES);
export type IdeaStatus = z.infer<typeof IdeaStatusSchema>;

/** What the owner sees, and what the person who sent it sees. */
export const IDEA_STATUS_LABELS: Record<IdeaStatus, { owner: string; shopper: string }> = {
  new: { owner: "New", shopper: "Received" },
  reviewing: { owner: "Reviewing", shopper: "Being reviewed" },
  selected: { owner: "Selected", shopper: "Chosen" },
  declined: { owner: "Declined", shopper: "Not chosen this time" },
};

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().default("");

export const IdeaUploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
});
export type IdeaUploadRequest = z.infer<typeof IdeaUploadRequestSchema>;

export const IdeaSubmitRequestSchema = z
  .object({
    idea: optionalText(4000, "Keep the idea under 4,000 characters."),
    verse: optionalText(300, "Keep the verse under 300 characters."),
    context: optionalText(4000, "Keep the biblical context under 4,000 characters."),
    imagePath: z
      .string()
      .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg)$/, "That upload isn’t yours.")
      .nullable()
      .optional()
      .default(null),
    rights: z.literal(true, "Confirm the design is yours to share."),
    website: z.string().max(0).optional().default(""),
  })
  .refine((v) => v.imagePath || v.idea || v.verse || v.context, {
    message: "Add an image or a few words about your idea.",
    path: ["idea"],
  });
export type IdeaSubmitRequest = z.input<typeof IdeaSubmitRequestSchema>;

export const IdeaReviewRequestSchema = z.object({
  id: z.uuid(),
  status: IdeaStatusSchema,
  note: z.string().trim().max(2000),
});
export type IdeaReviewRequest = z.infer<typeof IdeaReviewRequestSchema>;

/** A submission as its sender sees it in My Archive. */
export interface ShopperIdea {
  id: string;
  createdAt: string;
  idea: string | null;
  verse: string | null;
  context: string | null;
  imageUrl: string | null;
  status: IdeaStatus;
}
