import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { OrderNumber, ShortId, when } from "@/features/archive/admin/format";
import { FoundingNote } from "@/features/archive/admin/founding-note";
import { FoundingTools } from "@/features/archive/admin/founding-tools";
import { HonoraryList, HonoraryTools } from "@/features/archive/admin/honorary-tools";
import { listFounding, listHonorary } from "@/server/archive/founding";
import { FOUNDING_CAP, FOUNDING_RULES } from "@/server/archive/founding-policy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Founding", robots: { index: false } };

export default async function FoundingPage() {
  const [{ members, candidates, orderNumbers, people, placesUsed, placesLeft }, honorary] =
    await Promise.all([listFounding(), listHonorary()]);
  // An account by its email (its user id on hover, for Corrections), or its id when it has none.
  const person = (userId: string | null) =>
    userId && people[userId]?.email ? (
      <span title={userId}>{people[userId].email}</span>
    ) : (
      <ShortId id={userId} />
    );

  return (
    <>
      <PageHeader
        title="Founding"
        note={`${placesUsed} of ${FOUNDING_CAP} places used, ${placesLeft} left.`}
      />

      <section className="admin-section">
        <h2 className="aw-h3">Founding Members</h2>
        <p className="aw-body">The first 50 qualifying buyers, in place order.</p>
        {members.length === 0 ? (
          <p className="aw-body">No places awarded yet.</p>
        ) : (
          <div className="admin-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Place</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Order</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Awarded by</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>No. {m.rank}</td>
                    <td>{person(m.user_id)}</td>
                    <td>{(m.user_id && people[m.user_id]?.name) ?? ""}</td>
                    <td>
                      <OrderNumber id={m.order_id} number={orderNumbers[m.order_id ?? ""]} />
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
        <h2 className="aw-h3">Honorary seals</h2>
        <p className="aw-body">
          For people you want to honor beyond the first 50. Same features, no number, and they don’t
          use a place.
        </p>
        <HonoraryList
          rows={honorary.map((h) => ({
            userId: h.userId,
            email: h.email,
            name: h.name,
            reason: h.reason,
            granted: when(h.grantedAt),
          }))}
        />
        <h3 className="aw-label">Grant an honorary seal</h3>
        <HonoraryTools />
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
                  <th>Email</th>
                  <th>Order</th>
                  <th>Paid</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.user_id}>
                    <td>{person(c.user_id)}</td>
                    <td>
                      <OrderNumber id={c.order_id} number={orderNumbers[c.order_id ?? ""]} />
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
          Before each release, write to your Founding and honorary members about what’s coming. Send
          yourself a test first.
        </p>
        <FoundingNote
          members={members.filter((m) => m.status === "active").length + honorary.length}
        />
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
