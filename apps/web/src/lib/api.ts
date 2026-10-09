"use client";

import { createApiClient } from "@awebound/shared";
import { publicEnv } from "./env";
import { getBrowserSupabase } from "./supabase/browser";

/** Browser API client. Sends the Supabase session token when the shopper is signed in. */
export const api = createApiClient({
  baseUrl: publicEnv.NEXT_PUBLIC_API_URL,
  getAccessToken: async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});
