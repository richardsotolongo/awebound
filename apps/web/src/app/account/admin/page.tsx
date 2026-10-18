import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { FlagToggle } from "@/features/archive/admin/flag-toggle";
import { when } from "@/features/archive/admin/format";
import {
  ImportDraftsButton,
  ReconcileButton,
  SendQueuedButton,
} from "@/features/archive/admin/owner-buttons";
import { listOutbox } from "@/server/archive/email-outbox";
import { listFlags } from "@/server/archive/flags";
import { orderCounts, providerAssumptions } from "@/server/archive/orders-admin";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { listAdmins } from "@/server/archive/roles";
import { getBrandContent } from "@/server/content";
import { serverEnv } from "@/server/env";
import { FLAG_KEYS } from "@/shared";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Owner", robots: { index: false } };

interface OutboxRow {
  id: string;
  template: string;
  status: string;
  error: string | null;
  created_at: string;
}

const state = (ok: boolean, yes = "Set", no = "Not set") => (ok ? yes : no);

function Counts({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div>
      <h3 className="aw-h3">{title}</h3>
      <table className="admin-table">
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td>None yet</td>
            </tr>
          ) : (
            rows.map(([k, n]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{n}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function HealthPage() {
  const [readiness, admins, counts, flags, assumptions, outbox, content] = await Promise.all([
    getArchiveReadiness(),
    listAdmins(),
    orderCounts(),
    listFlags(),
    providerAssumptions(),
    listOutbox() as Promise<OutboxRow[]>,
    getBrandContent(),
  ]);
  const designs = content.products.length;
  const facts: [string, string][] = [
    ["Catalog", content.source === "database" ? "Database" : "catalog.json (database not read)"],
    ["Webhook secret", state(Boolean(serverEnv.FOURTHWALL_WEBHOOK_SECRET))],
    ["API user", state(readiness.platformApi)],
    ["Resend", state(Boolean(serverEnv.RESEND_API_KEY))],
    ["Storage bucket", state(readiness.storage, "Reachable", "Not reachable")],
    ["Cron secret", state(readiness.cron)],
    ["Export fonts", state(readiness.fonts, "Loaded", "Missing")],
    ["Admins", String(admins.length)],
    ["Published designs", `${readiness.publishedDesigns}/${designs}`],
    ["Published wallpapers", `${readiness.publishedAssets}/${designs * 2}`],
    ["Orders", String(counts.total)],
    ...Object.entries(counts.byState).map(([s, n]): [string, string] => [`Orders ${s}`, String(n)]),
    ["Unlinked orders", String(counts.unlinked)],
    ["Needs review", String(counts.needsReview)],
    ["Test orders", String(counts.test)],
    ["Failed webhook events", String(counts.failedEvents)],
    ["Last webhook", when(counts.lastEventAt, "Never")],
    ["Last reconciliation", when(counts.lastRunAt, "Never")],
  ];

  return (
    <>
      <PageHeader
        title="Owner"
        intro="What is set, what is on, and what the first orders taught us. Names only, never values."
      />

      <section className="admin-section">
        <h2 className="aw-h3">Readiness</h2>
        <dl className="admin-facts">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        {readiness.missing.length > 0 ? (
          <>
            <h3 className="aw-h3">Not set yet</h3>
            <ul className="admin-list">
              {readiness.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="aw-body">Everything is set.</p>
        )}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Flags</h2>
        <div className="admin-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Flag</th>
                <th>State</th>
                <th>Note</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {FLAG_KEYS.map((key) => {
                const row = flags.find((f) => f.key === key);
                return (
                  <tr key={key}>
                    <td>
                      <code className="admin-code">{key}</code>
                    </td>
                    <td>
                      <FlagToggle flagKey={key} enabled={row?.enabled ?? false} />
                    </td>
                    <td>{row?.note ?? ""}</td>
                    <td>{when(row?.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Actions</h2>
        <ImportDraftsButton />
        <ReconcileButton enabled={readiness.platformApi} />
        <SendQueuedButton />
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Provider assumptions</h2>
        <Counts title="Statuses seen" rows={Object.entries(assumptions.statuses)} />
        <Counts title="Source types" rows={Object.entries(assumptions.sourceTypes)} />
        <Counts
          title="Checkout matches"
          rows={[
            ["hit", assumptions.checkoutMatches.hit],
            ["miss", assumptions.checkoutMatches.miss],
            ["none", assumptions.checkoutMatches.none],
          ]}
        />
        <Counts
          title="Quantity known"
          rows={[
            ["yes", assumptions.quantityKnown.yes],
            ["no", assumptions.quantityKnown.no],
          ]}
        />
        <h3 className="aw-h3">API versions</h3>
        <p className="admin-code">{assumptions.apiVersions.join(", ") || "none yet"}</p>
        <h3 className="aw-h3">Fields seen</h3>
        <p className="admin-code">{assumptions.fieldsSeen.join(", ") || "none yet"}</p>
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Email outbox</h2>
        {outbox.length === 0 ? (
          <p className="aw-body">Nothing queued.</p>
        ) : (
          <div className="admin-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {outbox.map((row) => (
                  <tr key={row.id}>
                    <td>{row.template}</td>
                    <td>{row.status}</td>
                    <td>{when(row.created_at)}</td>
                    <td>{row.error ?? ""}</td>
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
