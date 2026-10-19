import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ShortId, when } from "@/features/archive/admin/format";
import { FoundingNote } from "@/features/archive/admin/founding-note";
import { FoundingTools } from "@/features/archive/admin/founding-tools";
import { listFounding } from "@/server/archive/founding";
import { FOUNDING_CAP, FOUNDING_RULES } from "@/server/archive/founding-policy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Founding", robots: { index: false } };

export default async function FoundingPage() {
  const { members, candidates, placesUsed, placesLeft } = await listFounding();

  return (
    <>
      <PageHeader
        title="Founding"
        note={`${placesUsed} of ${FOUNDING_CAP} places used, ${placesLeft} left.`}
      />

      <section className="admin-section">
        <h2 className="aw-h3">Members</h2>
        {members.length === 0 ? (
          <p className="aw-body">No places awarded yet.</p>
        ) : (
          <div className="admin-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Order</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Awarded by</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.rank}</td>
                    <td>
                      <ShortId id={m.user_id} />
                    </td>
                    <td>
                      <ShortId id={m.order_id} />
                    </td>
                    <td>{when(m.paid_at)}</td>
                    <td>{m.status}</td>
                    <td>{m.awarded_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Candidates</h2>
        {candidates.length === 0 ? (
          <p className="aw-body">Nobody is waiting.</p>
        ) : (
          <div className="admin-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Order</th>
                  <th>Paid</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.user_id}>
                    <td>
                      <ShortId id={c.user_id} />
                    </td>
                    <td>
                      <ShortId id={c.order_id} />
                    </td>
                    <td>{when(c.paid_at)}</td>
                    <td>{c.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Note to Founding Members</h2>
        <p className="aw-body">
          Before each release, write to your Founding Members about what’s coming. Send yourself a
          test first.
        </p>
        <FoundingNote members={members.filter((m) => m.status === "active").length} />
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Corrections</h2>
        <FoundingTools />
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Policy</h2>
        <ul className="admin-list">
          {FOUNDING_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
