import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ShortId, when } from "@/features/archive/admin/format";
import { listAudit } from "@/server/archive/orders-admin";
import type { AuditRow } from "@/server/archive/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit", robots: { index: false } };

const json = (v: unknown) => JSON.stringify(v, null, 2);

export default async function AuditPage() {
  const rows = (await listAudit()) as AuditRow[];

  return (
    <>
      <PageHeader
        title="Audit"
        intro="Every owner change, newest first. A change made from the command line has no actor."
      />
      {rows.length === 0 ? (
        <p className="aw-body">Nothing recorded yet.</p>
      ) : (
        <div className="admin-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{when(r.created_at)}</td>
                  <td>{r.actor_user_id ? <ShortId id={r.actor_user_id} /> : "command line"}</td>
                  <td>{r.action}</td>
                  <td>
                    {r.target_type} <code className="admin-code">{r.target_id ?? ""}</code>
                  </td>
                  <td>{r.reason ?? ""}</td>
                  <td>
                    {r.before === null && r.after === null ? (
                      "–"
                    ) : (
                      <details>
                        <summary>Before and after</summary>
                        <pre className="admin-code">{`${json(r.before)}\n→\n${json(r.after)}`}</pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
