import { ThornCross } from "@awebound/brand";
import type { Metadata } from "next";
import { AccountsClosedActions, accountsClosedCopy } from "@/features/account/accounts-closed";
import { SignInForm } from "@/features/auth/sign-in-form";
import { accountsEnabled } from "@/lib/env";
import { safeNext } from "@/lib/supabase/server";
import { getLatestRelease, withFallback } from "@/server/catalog";

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
  const release = await withFallback(getLatestRelease, null);
  const open = release?.status === "open";
  const closed = accountsClosedCopy(release);

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
            {open
              ? "An account keeps your details in one place. You can always check out as a guest instead."
              : "An account keeps your details in one place. You won’t need one to order once ordering opens."}
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
            <p className="aw-h3">{closed.title}</p>
            <p className="aw-small">{closed.intro}</p>
            <AccountsClosedActions release={release} />
          </div>
        )}
      </div>
    </div>
  );
}
