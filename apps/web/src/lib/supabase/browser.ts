"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
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

/** Whether the shopper is signed in. False on the first render (as on the server), then live. */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    // Fires once with the current session, then on every sign-in or sign-out.
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}
