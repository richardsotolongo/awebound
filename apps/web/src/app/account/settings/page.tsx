import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DeleteAccount } from "@/features/account/delete-account";
import { ProfileForm } from "@/features/account/profile-form";
import { ConsentForm } from "@/features/archive/consent-form";
import { EmailChangeForm } from "@/features/archive/email-change-form";
import { getServerSupabase } from "@/lib/supabase/server";
import { CONSENT_WORDING, getConsent } from "@/server/archive/consents";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { currentUser, signedInRecently } from "@/server/session";

export const metadata: Metadata = { title: "Account" };

const RECENT_MINUTES = 15;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Fsettings");
  const { changed } = await searchParams;
  const supabase = (await getServerSupabase())!;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null }>();
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name = profile?.full_name ?? meta?.full_name ?? meta?.name ?? "";
  const provider = (user.app_metadata as { provider?: string } | undefined)?.provider;
  const email = user.email ?? "";
  const readiness = await getArchiveReadiness();
  const [consent, reminders] = await Promise.all([
    readiness.emails.preferencesUi ? getConsent(user.id, "collection_updates") : null,
    readiness.emails.cartReminder ? getConsent(user.id, "cart_reminders") : null,
  ]);
  const recent = signedInRecently(user, RECENT_MINUTES);

  return (
    <>
      <PageHeader title="Account" hideTitle />
      {changed === "email" ? (
        <div className="notice" role="status" style={{ marginBottom: "var(--space-6)" }}>
          <p className="aw-small" style={{ color: "var(--ink)" }}>
            Your email address is updated.
          </p>
        </div>
      ) : null}

      <div className="account-panels">
        <section className="account-panel" aria-labelledby="details-title">
          <h2 id="details-title" className="aw-h3">
            Your details
          </h2>
          <ProfileForm initialName={name} />
        </section>

        <section className="account-panel" id="email" aria-labelledby="email-title">
          <h2 id="email-title" className="aw-h3">
            Email address
          </h2>
          <div className="field">
            <p className="aw-body account-email">{email}</p>
            <p className="field-help">
              {provider === "google"
                ? "You sign in with Google."
                : "Sign-in links and codes go here."}
            </p>
          </div>
          {recent ? (
            <EmailChangeForm current={email} />
          ) : (
            <p className="aw-small">
              To change it, <Link href="/sign-in?next=%2Faccount%2Fsettings">sign in again</Link>{" "}
              first.
            </p>
          )}
        </section>

        {readiness.emails.preferencesUi || readiness.emails.cartReminder ? (
          <section className="account-panel" id="preferences" aria-labelledby="prefs-title">
            <h2 id="prefs-title" className="aw-h3">
              Emails from us
            </h2>
            {readiness.emails.preferencesUi ? (
              <ConsentForm
                topic="collection_updates"
                initial={consent?.consented === true}
                wording={CONSENT_WORDING.collection_updates.wording}
              />
            ) : null}
            {readiness.emails.cartReminder ? (
              <div id="reminders">
                <ConsentForm
                  topic="cart_reminders"
                  initial={reminders?.consented !== false}
                  wording={CONSENT_WORDING.cart_reminders.wording}
                />
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="account-panel" aria-labelledby="signout-title">
          <h2 id="signout-title" className="aw-h3">
            Sign out
          </h2>
          <form action="/auth/sign-out" method="post" className="account-actions">
            <Button variant="secondary" type="submit">
              Sign out
            </Button>
            <p className="field-help">This signs you out on every device.</p>
          </form>
        </section>

        <section className="account-panel" aria-labelledby="privacy-title">
          <h2 id="privacy-title" className="aw-h3">
            Privacy
          </h2>
          <div className="account-actions">
            <p className="aw-body">What we keep and why is in the privacy policy.</p>
            <Button variant="link" href="/privacy">
              Read the privacy policy
            </Button>
          </div>
        </section>
      </div>

      <section className="account-panel account-danger" aria-labelledby="delete-title">
        <h2 id="delete-title" className="aw-h3">
          Delete account
        </h2>
        <DeleteAccount email={email} />
      </section>
    </>
  );
}
