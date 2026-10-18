import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ConsentTopic } from "@/shared";
import { UserError } from "../errors";
import type { ConsentRow } from "./types";

/** The exact words a shopper agreed to, versioned, so a later campaign can show what was consented to. */
export const CONSENT_WORDING: Record<ConsentTopic, { version: string; wording: string }> = {
  collection_updates: {
    version: "collection_updates.v1",
    wording: "Email me about new pieces and stories in the collection.",
  },
  cart_reminders: {
    version: "cart_reminders.v1",
    wording: "Email me once if I start a checkout and don’t finish it.",
  },
};

export async function getConsent(userId: string, topic: ConsentTopic): Promise<ConsentRow | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("email_consents")
    .select("*")
    .eq("user_id", userId)
    .eq("topic", topic)
    .maybeSingle();
  return (data as ConsentRow | null) ?? null;
}

export async function setConsent(
  userId: string,
  topic: ConsentTopic,
  consented: boolean,
  source: "settings" | "owner",
): Promise<ConsentRow> {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("email_consents")
    .upsert(
      {
        user_id: userId,
        topic,
        consented,
        wording_version: CONSENT_WORDING[topic].version,
        wording: CONSENT_WORDING[topic].wording,
        source,
        ...(consented ? { consented_at: now, revoked_at: null } : { revoked_at: now }),
      },
      { onConflict: "user_id,topic" },
    )
    .select("*")
    .single();
  if (error) throw new Error(`consent update failed: ${error.message}`);
  return data as ConsentRow;
}
