import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DeleteAccount } from "@/features/account/delete-account";
import { ProfileForm } from "@/features/account/profile-form";
import { accountsEnabled } from "@/lib/env";
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
          Shop the release
        </Button>
      </div>
    );
  }

  const supabase = (await getServerSupabase())!;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/sign-in?next=/account");

  // RLS lets a signed-in user read their own profile row.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null }>();

  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name = profile?.full_name ?? meta?.full_name ?? meta?.name ?? "";
  const provider = (user.app_metadata as { provider?: string } | undefined)?.provider;
  const email = user.email ?? "";

  return (
    <div className="aw-container account">
      <PageHeader
        eyebrow="Account"
        title={name ? `Welcome, ${name.split(" ")[0]}` : "Your account"}
        intro={
          <>
            Signed in as <span className="account-email">{email}</span> with{" "}
            {provider === "google" ? "Google" : "an email link"}.
          </>
        }
      >
        <form action="/auth/sign-out" method="post">
          <Button variant="secondary" type="submit">
            Sign out
          </Button>
        </form>
      </PageHeader>

      <div className="account-panels">
        <section className="account-panel" aria-labelledby="details-title">
          <h2 id="details-title" className="aw-h3">
            Your details
          </h2>
          <ProfileForm initialName={name} />
          <div className="field">
            <span className="aw-label">Email</span>
            <p className="aw-body account-email">{email}</p>
            <p className="field-help">Sign-in links and codes go to this address.</p>
          </div>
        </section>

        <section className="account-panel" aria-labelledby="orders-title">
          <h2 id="orders-title" className="aw-h3">
            Orders
          </h2>
          <p className="aw-body">
            Checkout runs through Fourthwall, our print and fulfillment partner. Order confirmations
            and tracking come by email to <span className="account-email">{email}</span>.
          </p>
          <p className="field-help">
            Questions about an order? Write to us with your order number.
          </p>
          <div className="account-actions">
            <Button variant="secondary" href="/contact">
              Contact us
            </Button>
            <Button variant="link" href="/shop">
              Shop the release
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
    </div>
  );
}
