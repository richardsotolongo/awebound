import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ClaimOrderForm } from "@/features/archive/claim-order-form";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { currentUser, hasVerifiedEmail } from "@/server/session";

export const metadata: Metadata = { title: "Link a past order" };

export default async function LinkOrderPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Forders%2Flink");
  const readiness = await getArchiveReadiness();
  return (
    <>
      <PageHeader
        title="Link a past order"
        intro="Enter the order number from your confirmation email. We’ll send a code to the email address on that order."
      />
      {!readiness.claims ? (
        <div className="notice" role="status">
          <p className="aw-body">
            Linking past orders isn’t available yet. Write to us with your order number and we’ll help.
          </p>
          <div>
            <Button variant="secondary" href="/contact">
              Contact us
            </Button>
          </div>
        </div>
      ) : !hasVerifiedEmail(user) ? (
        <div className="notice" role="status">
          <p className="aw-body">Confirm your email address first, then come back to link an order.</p>
        </div>
      ) : (
        <div style={{ maxWidth: 520 }}>
          <ClaimOrderForm />
        </div>
      )}
    </>
  );
}
