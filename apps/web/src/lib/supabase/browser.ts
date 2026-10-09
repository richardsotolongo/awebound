"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountsEnabled, publicEnv } from "../env";

let client: SupabaseClient | null = null;

/** The browser Supabase client, or null when accounts aren't configured yet. */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!accountsEnabled) return null;
  client ??= createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return client;
}
