import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerSupabase, safeNext } from "@/lib/supabase/server";

const OtpType = z.enum(["email", "email_change", "magiclink", "signup", "recovery"]).catch("email");

/** Target of the link in our email templates: verifies the token hash and signs the shopper in. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const tokenHash = url.searchParams.get("token_hash");
  const type = OtpType.parse(url.searchParams.get("type") ?? "email");
  const supabase = await getServerSupabase();

  if (supabase && tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(
    new URL(`/sign-in?error=link&next=${encodeURIComponent(next)}`, url.origin),
  );
}
