import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RefreshOrdersButton } from "@/features/archive/refresh-orders-button";
import { autoLinkByEmail, listOrdersForUser } from "@/server/archive/orders";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Orders" };

const SYNC = {
  confirmed: "Payment confirmed",
  pending: "We’re confirming this order with our checkout partner.",
  revoked: "Cancelled or refunded",
} as const;

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

export default async function OrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Forders");
  const readiness = await getArchiveReadiness();
  await autoLinkByEmail(user).catch(() => 0);
  const orders = readiness.orders ? await listOrdersForUser(user.id) : [];
  return (
    <>
      <PageHeader
        title="Orders"
        intro={
          !readiness.orders
            ? "Order history isn’t connected yet. Order confirmations and tracking still come by email."
            : orders.length > 0
              ? "Orders linked to your account. Confirmations and tracking still come by email."
              : "No orders linked yet. Orders placed while signed in appear here after payment is confirmed."
        }
      >
        <div className="account-actions">
          {readiness.orders && readiness.platformApi ? <RefreshOrdersButton /> : null}
          {readiness.claims ? (
            <Button variant="link" href="/account/orders/link">
              Link a past order
            </Button>
          ) : null}
        </div>
      </PageHeader>
      {orders.length > 0 ? (
        <ul className="archive-orders">
          {orders.map((o) => (
            <li key={o.id} className="archive-order">
              <p className="aw-h3">Order {o.friendlyId ?? o.id}</p>
              <p className="aw-small">
                {date(o.placedAt)}
                {o.placedAt ? ". " : ""}
                {SYNC[o.sync]}
              </p>
              {o.lines.length > 0 ? (
                <ul className="archive-order-lines">
                  {o.lines.map((l, i) => (
                    <li key={i}>
                      {l.name}
                      {l.color || l.size ? `, ${[l.color, l.size].filter(Boolean).join(", ")}` : ""}
                      {l.quantity > 1 ? ` (x${l.quantity})` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <section className="account-panel" style={{ marginTop: "var(--space-8)" }} aria-labelledby="help-title">
        <h2 id="help-title" className="aw-h3">
          Questions about an order?
        </h2>
        <p className="aw-body">Write to us with your order number. Confirmations and tracking come by email.</p>
        <div className="account-actions">
          <Button variant="secondary" href="/contact">
            Contact us
          </Button>
        </div>
      </section>
    </>
  );
}
