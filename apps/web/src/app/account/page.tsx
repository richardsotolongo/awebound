import { Button } from "@awebound/brand";
import { createApiClient, type Profile } from "@awebound/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/features/account/profile-form";
import { accountsEnabled, publicEnv } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

export default async function AccountPage() {
  if (!accountsEnabled) {
    return (
      <div className="aw-container" style={{ paddingBottom: "var(--space-24)" }}>
        <PageHeader
          eyebrow="Account"
          title="Accounts open soon"
          intro="You can still shop and check out as a guest."
        />
        <Button variant="secondary" href="/shop">
          Shop the collection
        </Button>
      </div>
    );
  }

  const supabase = (await getServerSupabase())!;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/sign-in?next=/account");

  const { data: sessionData } = await supabase.auth.getSession();
  const client = createApiClient({
    baseUrl: process.env.API_URL?.trim() || publicEnv.NEXT_PUBLIC_API_URL,
    getAccessToken: () => sessionData.session?.access_token ?? null,
    init: { cache: "no-store" },
  });
  let profile: Profile | null = null;
  try {
    profile = await client.getMe();
  } catch {
    profile = null;
  }

  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name = profile?.fullName ?? meta?.full_name ?? meta?.name ?? "";
  const provider = (user.app_metadata as { provider?: string } | undefined)?.provider;

  return (
    <div className="aw-container" style={{ paddingBottom: "var(--space-24)" }}>
      <PageHeader
        eyebrow="Account"
        title={name ? `Welcome, ${name.split(" ")[0]}` : "Your account"}
      />
      <div className="split">
        <div style={{ display: "grid", gap: "var(--space-12)", alignContent: "start" }}>
          <section
            aria-labelledby="details-title"
            style={{ display: "grid", gap: "var(--space-6)" }}
          >
            <h2 id="details-title" className="aw-h2">
              Details
            </h2>
            <ProfileForm initialName={name} />
            <div className="field">
              <span className="aw-label">Email</span>
              <p className="aw-body" style={{ color: "var(--ink)" }}>
                {user.email}
              </p>
              <p className="field-help">
                Signed in with {provider === "google" ? "Google" : "an email link"}.
              </p>
            </div>
          </section>

          <section
            aria-labelledby="orders-title"
            style={{ display: "grid", gap: "var(--space-4)" }}
          >
            <h2 id="orders-title" className="aw-h2">
              Orders
            </h2>
            <p className="aw-body">Your orders will appear here once checkout opens.</p>
          </section>
        </div>

        <aside style={{ display: "grid", gap: "var(--space-4)", alignContent: "start" }}>
          <form action="/auth/sign-out" method="post">
            <Button variant="secondary" type="submit">
              Sign out
            </Button>
          </form>
          <p className="field-help">
            Want your account deleted? Email us from this address and we’ll remove it and its data.
          </p>
        </aside>
      </div>
    </div>
  );
}
