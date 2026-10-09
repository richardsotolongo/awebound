import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the secret (or legacy service_role) key. It bypasses RLS,
 * so every query here filters explicitly (published products only, rows owned by the caller).
 */
export function createSupabaseAdmin(url: string, secretKey: string): SupabaseClient {
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "x-client-info": "awebound-api" } },
  });
}
