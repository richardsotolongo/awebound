import { z } from "zod";

export const CONTACT_EMAIL = "contact@awebound.store";

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
  /** Honeypot, hidden from people. Bots fill it; the API then answers "ok" and sends nothing. */
  website: z.string().max(500).optional(),
});
export type ContactRequest = z.infer<typeof ContactRequestSchema>;

export const SUBSCRIBER_SOURCES = ["footer", "checkout", "product"] as const;

export const SubscribeRequestSchema = z.object({
  email: z.email("Enter an email address like you@example.com."),
  source: z.enum(SUBSCRIBER_SOURCES),
  productSlug: z.string().max(120).optional(),
});
export type SubscribeRequest = z.infer<typeof SubscribeRequestSchema>;

export const OkSchema = z.object({ ok: z.literal(true) });
export type Ok = z.infer<typeof OkSchema>;
