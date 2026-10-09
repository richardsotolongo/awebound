import { Button, ThornCross } from "@awebound/brand";
import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/sign-in-form";
import { accountsEnabled } from "@/lib/env";
import { safeNext } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Awebound with Google or a one-time email link. No password needed.",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Send a new one.",
  oauth: "Google sign-in didn’t finish. Try again.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const error = params.error ? (ERRORS[params.error] ?? ERRORS.link) : null;

  return (
    <div className="aw-container section" style={{ display: "grid", justifyItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: "var(--space-8)" }}>
        <div
          style={{
            display: "grid",
            gap: "var(--space-4)",
            justifyItems: "center",
            textAlign: "center",
          }}
        >
          <span style={{ color: "var(--line-strong)" }}>
            <ThornCross size="small" height={48} title="" />
          </span>
          <h1 className="aw-h1">Sign in</h1>
          <p className="aw-body">
            Keep your details and, soon, see your orders. You can always check out as a guest.
          </p>
        </div>
        {error ? (
          <p className="notice aw-small" role="alert">
            {error}
          </p>
        ) : null}
        {accountsEnabled ? (
          <SignInForm next={next} />
        ) : (
          <div className="notice" role="status">
            <p className="aw-h3">Accounts open soon</p>
            <p className="aw-small">You can still shop and check out as a guest.</p>
            <div>
              <Button variant="secondary" href="/shop">
                Shop the release
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
