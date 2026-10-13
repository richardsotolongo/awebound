import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env";
import { sendEmail } from "../email";
import {
  archiveWelcome,
  collectionUpdate,
  designUnlocked,
  type RenderedEmail,
} from "../email-templates";
import { getFlags } from "./flags";
import { logArchive } from "./log";
import { getConsent } from "./consents";

/**
 * Custom Archive emails go through here and nowhere else. While a template's flag is off the
 * call only records that nothing was sent; when on, it queues and sends through Resend. Nothing
 * runs on a schedule: sending is explicit.
 */
export type OutboxTemplate = "archive_welcome" | "design_unlocked" | "collection_update";

const FLAG_FOR: Record<
  OutboxTemplate,
  "email.welcome" | "email.unlock" | "email.collection_updates"
> = {
  archive_welcome: "email.welcome",
  design_unlocked: "email.unlock",
  collection_update: "email.collection_updates",
};

function render(template: OutboxTemplate, payload: Record<string, unknown>): RenderedEmail {
  switch (template) {
    case "archive_welcome":
      return archiveWelcome(siteUrl);
    case "design_unlocked":
      return designUnlocked({
        name: String(payload.name ?? "Your design"),
        slug: String(payload.slug ?? ""),
        siteUrl,
      });
    case "collection_update":
      return collectionUpdate({
        subject: String(payload.subject ?? "From the Awebound collection"),
        lead: String(payload.lead ?? ""),
        body: String(payload.body ?? ""),
        siteUrl,
      });
  }
}

export async function queueEmail(input: {
  template: OutboxTemplate;
  userId: string | null;
  to: string | null;
  payload?: Record<string, unknown>;
}) {
  if (!supabaseAdmin) return;
  const flags = await getFlags();
  const on = flags[FLAG_FOR[input.template]];
  const consented =
    input.template !== "collection_update" ||
    (input.userId
      ? (await getConsent(input.userId, "collection_updates"))?.consented === true
      : false);
  const status = on && consented && input.to ? "queued" : "skipped_disabled";
  const { data, error } = await supabaseAdmin
    .from("email_outbox")
    .insert({
      user_id: input.userId,
      to_email: status === "queued" ? input.to : null,
      template: input.template,
      payload: input.payload ?? null,
      status,
    })
    .select("id")
    .single();
  if (error) {
    logArchive("outbox", { event: "insert_failed", message: error.message });
    return;
  }
  if (status === "queued")
    await deliver((data as { id: string }).id, input.to!, input.template, input.payload ?? {});
}

async function deliver(
  id: string,
  to: string,
  template: OutboxTemplate,
  payload: Record<string, unknown>,
) {
  if (!supabaseAdmin) return;
  try {
    await sendEmail(to, render(template, payload));
    await supabaseAdmin
      .from("email_outbox")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);
  } catch (err) {
    await supabaseAdmin
      .from("email_outbox")
      .update({ status: "failed", error: err instanceof Error ? err.message : String(err) })
      .eq("id", id);
  }
}

/** A new account's welcome, once; a no-op record while the welcome flag is off. */
export async function queueWelcomeIfNew(user: {
  id: string;
  email?: string | null;
  created_at?: string;
}) {
  if (!supabaseAdmin || !user.created_at) return;
  if (Date.now() - new Date(user.created_at).getTime() > 10 * 60_000) return;
  const { count } = await supabaseAdmin
    .from("email_outbox")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("template", "archive_welcome");
  if ((count ?? 0) > 0) return;
  await queueEmail({ template: "archive_welcome", userId: user.id, to: user.email ?? null });
}

/** Retries queued or failed rows; wired to an owner button, never to a schedule. */
export async function sendQueued(limit = 50): Promise<number> {
  if (!supabaseAdmin) return 0;
  const { data } = await supabaseAdmin
    .from("email_outbox")
    .select("*")
    .in("status", ["queued", "failed"])
    .order("created_at")
    .limit(limit);
  let sent = 0;
  for (const row of (data ?? []) as {
    id: string;
    to_email: string | null;
    template: OutboxTemplate;
    payload: Record<string, unknown> | null;
  }[]) {
    if (!row.to_email) continue;
    await deliver(row.id, row.to_email, row.template, row.payload ?? {});
    sent++;
  }
  return sent;
}

export async function listOutbox(limit = 50) {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("email_outbox")
    .select("id, user_id, template, status, error, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
