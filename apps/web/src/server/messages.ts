import "server-only";
import type { ContactRequest, SubscribeRequest } from "@/shared";
import { siteUrl } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "./email";
import {
  contactAcknowledgement,
  contactNotification,
  subscriberWelcome,
  type ContactMessage,
} from "./email-templates";
import { serverEnv } from "./env";
import { UserError } from "./errors";

/**
 * Stores a contact message and emails it to the store inbox (reply-to the sender), then sends the
 * sender an acknowledgement. Succeeds if the message was either stored or emailed, so one outage
 * never loses a message silently.
 */
export async function submitContactMessage(
  input: Omit<ContactRequest, "website">,
  userId?: string,
): Promise<void> {
  let id: string | null = null;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({ ...input, user_id: userId ?? null })
      .select("id")
      .single();
    if (error) console.error("[contact] message could not be stored:", error.message);
    id = data?.id ?? null;
  }
  const message: ContactMessage = { id: id ?? "unsaved", ...input };

  let emailed = false;
  try {
    await sendEmail(serverEnv.CONTACT_INBOX, contactNotification(message, siteUrl), input.email);
    emailed = true;
    if (id && supabaseAdmin) {
      await supabaseAdmin
        .from("contact_messages")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", id);
    }
  } catch (err) {
    console.error("[contact] notification failed:", err);
  }
  if (!id && !emailed) {
    throw new UserError(
      `Your message didn’t go through. Email us directly at ${serverEnv.CONTACT_INBOX}.`,
    );
  }

  await sendEmail(input.email, contactAcknowledgement(message, siteUrl), serverEnv.CONTACT_INBOX).catch(
    (err: unknown) => console.warn("[contact] acknowledgement failed:", err),
  );
}

/** Adds an address to drop notes. Answers the same either way, so it never reveals who is subscribed. */
export async function subscribeToDropNotes(input: SubscribeRequest): Promise<void> {
  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from("subscribers").insert({
      email: input.email.trim().toLowerCase(),
      source: input.source,
      product_slug: input.productSlug ?? null,
    });
    // 23505 = unique_violation: already subscribed, so no second welcome.
    if (error?.code === "23505") return;
    if (error) throw new Error(`subscribers insert failed: ${error.message}`);
  }
  await sendEmail(input.email, subscriberWelcome(siteUrl), serverEnv.CONTACT_INBOX).catch(
    (err: unknown) => console.warn("[subscribe] welcome email failed:", err),
  );
}
