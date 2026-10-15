import { ThornCross } from "@awebound/brand";
import type { Metadata } from "next";
import { AccountsClosedActions, accountsClosedCopy } from "@/features/account/accounts-closed";
import { BenefitsList } from "@/features/archive/benefits-list";
import { SignInForm } from "@/features/auth/sign-in-form";
import { accountsEnabled } from "@/lib/env";
import { safeNext } from "@/lib/supabase/server";
import { getArchiveOffer } from "@/server/archive/offer";
import { plateCss } from "@/shared";
import { getLatestRelease, searchProducts, withFallback } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Join Awebound",
  description:
    "Create a free Awebound account or sign in with Google or a one-time email link. No password needed.",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Send a new one.",
  oauth: "Google sign-in didn’t finish. Try again.",
};

/** Sign-in and sign-up are the same passwordless flow; the page says what the account brings. */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const error = params.error ? (ERRORS[params.error] ?? ERRORS.link) : null;
  const [release, offer] = await Promise.all([
    withFallback(getLatestRelease, null),
    getArchiveOffer(),
  ]);
  // The tiles' pictures come from the release's own pieces, its lead (featured) piece first.
  const listed = release
    ? await withFallback(() => searchProducts({ collection: [release.slug], pageSize: 48 }), null)
    : null;
  const ordered = [...(listed?.items ?? [])].sort((a, b) => a.position - b.position);
  const lead = ordered.find((p) => p.featured) ?? ordered[0];
  const pieces = (lead ? [lead, ...ordered.filter((p) => p !== lead)] : [])
    .filter((p) => p.plate)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      plate: plateCss(p.plate),
      reference: p.scripture.reference,
    }));
  const closed = accountsClosedCopy();

  return (
    <div className="aw-container section">
      <div className="split split-even">
        <div style={{ width: "100%", maxWidth: 440, display: "grid", gap: "var(--space-8)" }}>
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <span style={{ color: "var(--line-strong)" }}>
              <ThornCross size="small" height={48} title="" />
            </span>
            <h1 className="aw-h1">Join Awebound</h1>
            <p className="aw-body">Accounts are free. Guest checkout is always available.</p>
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
        <BenefitsList offer={offer} pieces={pieces} quote={lead?.scripture ?? null} />
      </div>
    </div>
  );
}
