import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RefreshOrdersButton } from "@/features/archive/refresh-orders-button";
import { autoLinkByEmail, listOrdersForUser } from "@/server/archive/orders";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Orders" };

// A just-placed order shows its date alone until payment is confirmed.
const SYNC = {
  confirmed: "Payment confirmed",
  pending: null,
  revoked: "Cancelled or refunded",
} as const;

const date = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

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
                {[date(o.placedAt), SYNC[o.sync]].filter(Boolean).join(". ")}
              </p>
              {o.lines.length > 0 ? (
                <ul className="archive-order-lines">
                  {o.lines.map((l, i) => (
                    <li key={i} className="archive-order-line">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- site image, plain img like the shop
                        <img src={l.image} alt="" />
                      ) : (
                        <span aria-hidden="true" />
                      )}
                      <div>
                        <p className="archive-order-line-name">
                          {l.slug ? <Link href={`/shop/${l.slug}`}>{l.name}</Link> : l.name}
                        </p>
                        <p className="aw-small">
                          {[
                            l.cut,
                            l.color,
                            l.size && (l.size === "One size" ? "one size" : `size ${l.size}`),
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <p className="aw-small">Quantity {l.quantity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <section
        className="account-panel"
        style={{ marginTop: "var(--space-8)" }}
        aria-labelledby="help-title"
      >
        <h2 id="help-title" className="aw-h3">
          Questions about an order?
        </h2>
        <p className="aw-body">
          Write to us with your order number. Confirmations and tracking come by email.
        </p>
        <div className="account-actions">
          <Button variant="secondary" href="/contact">
            Contact us
          </Button>
        </div>
      </section>
    </>
  );
}
