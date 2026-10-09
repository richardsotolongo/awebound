import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase, safeNext } from "@/lib/supabase/server";

/** Finishes Google sign-in and email links that use the PKCE code flow. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const supabase = await getServerSupabase();

  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  const reason = url.searchParams.get("error") ? "oauth" : "link";
  return NextResponse.redirect(
    new URL(`/sign-in?error=${reason}&next=${encodeURIComponent(next)}`, url.origin),
  );
}
