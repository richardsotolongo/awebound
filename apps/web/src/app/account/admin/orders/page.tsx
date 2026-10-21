import type { Metadata } from "next";
import { Fragment } from "react";
import { PageHeader } from "@/components/page-header";
import { OrderNumber, ShortId, when } from "@/features/archive/admin/format";
import { OrderTools } from "@/features/archive/admin/order-tools";
import { hashEmail } from "@/server/archive/log";
import {
  listOrdersAdmin,
  listReconciliationRuns,
  listWebhookEvents,
} from "@/server/archive/orders-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders", robots: { index: false } };

const emailLabel = (email: string | null) =>
  email ? `${hashEmail(email).slice(0, 8)}@${email.split("@")[1] ?? ""}` : "–";
const yesNo = (v: boolean | null) => (v === null ? "–" : v ? "yes" : "no");
const json = (v: unknown) => JSON.stringify(v, null, 2);

export default async function OrdersPage() {
  const [orders, events, runs] = await Promise.all([
    listOrdersAdmin(),
    listWebhookEvents(),
    listReconciliationRuns(),
  ]);

  return (
    <>
      <PageHeader
        title="Orders"
        intro="Newest first. An email address shows as a hash prefix and its domain, never in full."
      />

      <section className="admin-section">
        <h2 className="aw-h3">Orders</h2>
        {orders.length === 0 ? (
          <p className="aw-body">No orders yet.</p>
        ) : (
          <div className="admin-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Linked</th>
                  <th>Review</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <Fragment key={o.id}>
                    <tr>
                      <td>
                        <OrderNumber id={o.id} number={o.friendly_id} />
                      </td>
                      <td>{emailLabel(o.email)}</td>
                      <td>
                        {o.status_raw ?? "–"} ({o.payment_state})
                      </td>
                      <td>
                        {o.source_type ?? "–"}
                        {o.test_mode ? ", test" : ""}
                      </td>
                      <td>
                        {o.user_id ? (
                          <>
                            <ShortId id={o.user_id} /> by {o.link_method ?? "–"}, registered
                            checkout {yesNo(o.registered_checkout)}
                          </>
                        ) : (
                          "unlinked"
                        )}
                      </td>
                      <td>{o.needs_review ? (o.review_reason ?? "yes") : "–"}</td>
                      <td>{when(o.provider_created_at)}</td>
                    </tr>
                    <tr>
                      <td colSpan={7}>
                        <details>
                          <summary>Lines and tools</summary>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Line</th>
                                <th>Offer</th>
                                <th>Design</th>
                                <th>Color</th>
                                <th>Size</th>
                                <th>Quantity</th>
                                <th>Refunded</th>
                                <th>Eligible</th>
                                <th>State</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.lines.map((l) => (
                                <tr key={l.id}>
                                  <td>
                                    <code className="admin-code">{l.id}</code>
                                  </td>
                                  <td>{l.offer_slug ?? l.offer_name ?? "–"}</td>
                                  <td>{l.design_key ?? "–"}</td>
                                  <td>{l.color ?? "–"}</td>
                                  <td>{l.size ?? "–"}</td>
                                  <td>{l.quantity}</td>
                                  <td>{l.refunded_quantity}</td>
                                  <td>{l.eligible_quantity}</td>
                                  <td>{l.line_state}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <OrderTools
                            orderId={o.id}
                            userId={o.user_id}
                            lines={o.lines.map((l) => ({
                              id: l.id,
                              label: [l.offer_slug ?? l.offer_name ?? l.id, l.color, l.size]
                                .filter(Boolean)
                                .join(" "),
                              eligible: l.eligible_quantity,
                            }))}
                          />
                        </details>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Webhook events</h2>
        {events.length === 0 ? (
          <p className="aw-body">No events yet.</p>
        ) : (
          <div className="admin-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Test</th>
                  <th>API version</th>
                  <th>Received</th>
                  <th>Error</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <ShortId id={e.id} />
                    </td>
                    <td>{e.type}</td>
                    <td>{e.status}</td>
                    <td>{e.test_mode ? "yes" : "no"}</td>
                    <td>{e.api_version ?? "–"}</td>
                    <td>{when(e.received_at)}</td>
                    <td>{e.error ?? ""}</td>
                    <td>
                      <details>
                        <summary>Payload</summary>
                        <pre className="admin-code">{json(e.payload)}</pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Reconciliation runs</h2>
        {runs.length === 0 ? (
          <p className="aw-body">No runs yet.</p>
        ) : (
          <div className="admin-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Trigger</th>
                  <th>Started</th>
                  <th>Finished</th>
                  <th>Checked</th>
                  <th>Changed</th>
                  <th>Listed all</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <ShortId id={r.id} />
                    </td>
                    <td>{r.trigger}</td>
                    <td>{when(r.started_at)}</td>
                    <td>{when(r.finished_at)}</td>
                    <td>{r.orders_checked}</td>
                    <td>{r.orders_changed}</td>
                    <td>{r.listed_all ? "yes" : "no"}</td>
                    <td>{r.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
