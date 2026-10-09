import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/server/env";
import { publicEnv } from "../env";

/**
 * Supabase with the secret key, or null when it isn't configured. It bypasses RLS, so every query
 * scopes itself (the caller's own profile row; insert-only inbox tables).
 */
export const supabaseAdmin =
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && serverEnv.SUPABASE_SECRET_KEY
    ? createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SECRET_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
