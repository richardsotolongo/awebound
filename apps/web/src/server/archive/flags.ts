import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { FLAG_KEYS, type FlagKey } from "@/shared";
import { audit } from "./audit";
import type { FlagRow } from "./types";

/** Per-feature switches the owner can turn (feature_flags). A missing row reads as off. */
export const getFlags = cache(async (): Promise<Record<FlagKey, boolean>> => {
  const flags = Object.fromEntries(FLAG_KEYS.map((k) => [k, false])) as Record<FlagKey, boolean>;
  if (!supabaseAdmin) return flags;
  const { data } = await supabaseAdmin.from("feature_flags").select("key, enabled");
  for (const row of (data ?? []) as Pick<FlagRow, "key" | "enabled">[]) {
    if ((FLAG_KEYS as readonly string[]).includes(row.key)) flags[row.key as FlagKey] = row.enabled;
  }
  return flags;
});

export async function listFlags(): Promise<FlagRow[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from("feature_flags").select("*").order("key");
  return (data ?? []) as FlagRow[];
}

export async function setFlag(key: FlagKey, enabled: boolean, note: string | undefined, actor: string) {
  if (!supabaseAdmin) throw new Error("database not configured");
  const before = (await getFlags())[key];
  const { error } = await supabaseAdmin
    .from("feature_flags")
    .upsert({ key, enabled, ...(note !== undefined ? { note } : {}), updated_by: actor }, { onConflict: "key" });
  if (error) throw new Error(`flag update failed: ${error.message}`);
  await audit(actor, "flag.set", "feature_flag", key, { enabled: before }, { enabled, note });
}
