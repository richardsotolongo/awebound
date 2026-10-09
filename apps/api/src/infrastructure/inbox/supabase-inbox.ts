import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContactRequest, SubscribeRequest } from "@awebound/shared";
import { z } from "zod";
import type {
  ContactMessage,
  ContactRepository,
  SubscriberRepository,
} from "../../application/ports";
import { UnavailableError } from "../../domain/errors";

const ContactRow = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  topic: z.enum(["order", "sizing", "returns", "wholesale", "press", "other"]),
  message: z.string(),
  created_at: z.string(),
});

export class SupabaseContactRepository implements ContactRepository {
  constructor(private readonly db: SupabaseClient) {}

  async save(
    input: Omit<ContactRequest, "website"> & { userId?: string },
  ): Promise<ContactMessage> {
    const { data, error } = await this.db
      .from("contact_messages")
      .insert({
        user_id: input.userId ?? null,
        name: input.name,
        email: input.email,
        topic: input.topic,
        message: input.message,
      })
      .select("id, name, email, topic, message, created_at")
      .single();
    if (error) throw Object.assign(new UnavailableError(), { cause: error });
    const row = ContactRow.parse(data);
    return { ...row, createdAt: new Date(row.created_at) };
  }

  async markEmailed(id: string): Promise<void> {
    await this.db
      .from("contact_messages")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", id);
  }
}

export class SupabaseSubscriberRepository implements SubscriberRepository {
  constructor(private readonly db: SupabaseClient) {}

  async add(input: SubscribeRequest): Promise<boolean> {
    const { error } = await this.db.from("subscribers").insert({
      email: input.email,
      source: input.source,
      product_slug: input.productSlug ?? null,
    });
    if (!error) return true;
    // 23505 = unique_violation: already subscribed.
    if (error.code === "23505") return false;
    throw Object.assign(new UnavailableError(), { cause: error });
  }
}
