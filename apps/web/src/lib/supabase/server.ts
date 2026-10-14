import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { accountsEnabled, publicEnv, siteUrl } from "../env";

/** Supabase client for Server Components and Route Handlers, bound to the request cookies. */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!accountsEnabled) return null;
  const store = await cookies();
  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) store.set(name, value, options);
          } catch {
            // Called from a Server Component, where cookies are read-only. The proxy refreshes them.
          }
        },
      },
    },
  );
}

/**
 * Only same-site destinations after sign-in: a path, or an absolute address on this site (the
 * email templates send one through `{{ .RedirectTo }}`). Anything else falls back, including
 * values with control characters or backslashes, which browsers strip before resolving
 * (`/\t/evil.com` would otherwise leave the site).
 */
export function safeNext(value: string | null | undefined, fallback = "/account"): string {
  if (!value || /[\u0000-\u001f\u007f\s\\]/.test(value)) return fallback;
  const site = new URL(siteUrl);
  if (!value.startsWith("/") && !value.startsWith(`${site.origin}/`) && value !== site.origin)
    return fallback;
  let url: URL;
  try {
    url = new URL(value, site);
  } catch {
    return fallback;
  }
  if (url.origin !== site.origin || url.pathname.startsWith("//")) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
