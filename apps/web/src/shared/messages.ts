import { z } from "zod";

/**
 * Awebound's one email address: shown everywhere on the site, and the inbox that receives every
 * contact message (the owner's choice, October 2026). Replies to the site's emails come here too.
 */
export const CONTACT_EMAIL = "aweboundstore@gmail.com";

export const CONTACT_TOPICS = [
  "order",
  "sizing",
  "returns",
  "wholesale",
  "press",
  "other",
] as const;
export const ContactTopicSchema = z.enum(CONTACT_TOPICS);
export type ContactTopic = z.infer<typeof ContactTopicSchema>;

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  order: "An order",
  sizing: "Sizing and fit",
  returns: "Refunds and replacements",
  wholesale: "Wholesale or church orders",
  press: "Press and collaborations",
  other: "Something else",
};

export const ContactRequestSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(120),
  email: z.email("Enter an email address like you@example.com."),
  topic: ContactTopicSchema,
  message: z.string().trim().min(10, "A few more words, please.").max(4000),
  /** Honeypot, hidden from people. Bots fill it; the server then answers "ok" and sends nothing. */
  website: z.string().max(500).optional(),
});
export type ContactRequest = z.infer<typeof ContactRequestSchema>;

export const SUBSCRIBER_SOURCES = ["footer", "product"] as const;

export const SubscribeRequestSchema = z.object({
  email: z.email("Enter an email address like you@example.com."),
  source: z.enum(SUBSCRIBER_SOURCES),
  productSlug: z.string().max(120).optional(),
});
export type SubscribeRequest = z.infer<typeof SubscribeRequestSchema>;
