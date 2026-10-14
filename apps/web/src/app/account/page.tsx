import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { purchaseBenefits } from "@/features/archive/benefits-list";
import { FoundingSeal } from "@/features/archive/founding-seal";
import { listDesigns } from "@/server/archive/designs";
import { listEntitlements } from "@/server/archive/entitlements";
import { getFoundingForUser } from "@/server/archive/founding";
import { queueWelcomeIfNew } from "@/server/archive/email-outbox";
import { autoLinkByEmail, listOrdersForUser } from "@/server/archive/orders";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { listSavedPieces } from "@/server/archive/saved";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "My Archive" };

const date = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

/** The overview: three tiles of the same size (saved pieces, the collection, orders). */
export default async function ArchivePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount");
  await Promise.all([
    autoLinkByEmail(user).catch(() => 0),
    queueWelcomeIfNew(user).catch(() => undefined),
  ]);
  const [readiness, saved, entitlements, designs, orders, founding] = await Promise.all([
    getArchiveReadiness(),
    listSavedPieces(user.id),
    listEntitlements(user.id),
    listDesigns(),
    listOrdersForUser(user.id),
    getFoundingForUser(user.id),
  ]);
  const owned = designs.filter((d) =>
    entitlements.some((e) => e.designKey === d.design_key && e.quantity > 0),
  );
  const empty = saved.length === 0 && orders.length === 0 && owned.length === 0;
  const latest = readiness.orders ? orders[0] : undefined;
  const benefits = purchaseBenefits(readiness);

  return (
    <>
      <header className="page-header account-head">
        <h1 className="visually-hidden">My Archive</h1>
        <p className="aw-small">
          Signed in as <span className="account-email">{user.email}</span>
        </p>
        {empty ? (
          <p className="aw-body">
            Your Archive is open. Save a piece and explore Behold. The full stories and extras for
            your purchased designs will appear here after payment is confirmed.
          </p>
        ) : null}
      </header>
      {founding && readiness.founding ? <FoundingSeal /> : null}

      <div className="account-panels account-tiles">
        <section className="account-panel" aria-labelledby="saved-title">
          <h2 id="saved-title" className="aw-h3">
            Saved pieces
          </h2>
          {saved.length > 0 ? (
            <>
              <p className="aw-small">{saved.length === 1 ? "1 saved" : `${saved.length} saved`}</p>
              <div className="archive-thumbs">
                {saved.slice(0, 4).map((s) =>
                  s.piece ? (
                    <Link key={s.slug} href={`/shop/${s.slug}`} aria-label={s.piece.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- site image, plain img like the shop */}
                      <img src={s.piece.image.url} alt="" />
                    </Link>
                  ) : null,
                )}
              </div>
            </>
          ) : (
            <p className="aw-body">
              Nothing saved yet. Use the heart on any piece to keep it here.
            </p>
          )}
          <div className="account-panel-foot">
            {saved.length > 0 ? (
              <Button variant="link" href="/account/saved">
                See your saved pieces
              </Button>
            ) : (
              <Button variant="secondary" href="/shop">
                Visit the shop
              </Button>
            )}
          </div>
        </section>

        <section className="account-panel" aria-labelledby="collection-title">
          <h2 id="collection-title" className="aw-h3">
            Your collection
          </h2>
          {owned.length > 0 ? (
            <ul className="archive-panel-list">
              {owned.map((d) => (
                <li key={d.design_key}>
                  <Link href={`/account/collection/${d.product_slug}`}>{d.name}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="aw-body">Your collection starts with your first piece.</p>
          )}
          <div className="account-panel-foot">
            <Button variant="link" href={owned.length > 0 ? "/account/collection" : "/shop"}>
              {owned.length > 0 ? "Open your collection" : "Explore Behold"}
            </Button>
          </div>
        </section>

        <section className="account-panel" aria-labelledby="orders-title">
          <h2 id="orders-title" className="aw-h3">
            Orders
          </h2>
          {!readiness.orders ? (
            <p className="aw-body">
              Order history isn’t connected yet. Order confirmations and tracking still come by
              email.
            </p>
          ) : latest ? (
            <>
              <p className="aw-small">
                Latest order {latest.friendlyId ?? latest.id}
                {latest.placedAt ? `, ${date(latest.placedAt)}` : ""}
              </p>
              <div className="archive-thumbs">
                {latest.lines.slice(0, 4).map((l, i) =>
                  l.image && l.slug ? (
                    <Link key={i} href={`/shop/${l.slug}`} aria-label={l.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- site image, plain img like the shop */}
                      <img src={l.image} alt="" />
                    </Link>
                  ) : null,
                )}
              </div>
            </>
          ) : (
            <p className="aw-body">No orders linked yet.</p>
          )}
          <div className="account-panel-foot account-actions">
            {readiness.orders ? (
              <Button variant="link" href="/account/orders">
                See your orders
              </Button>
            ) : null}
            {readiness.claims ? (
              <Button variant="link" href="/account/orders/link">
                Link a past order
              </Button>
            ) : null}
          </div>
        </section>
      </div>

      {owned.length === 0 && benefits.length > 0 ? (
        <section className="account-panel account-after" aria-labelledby="after-title">
          <h2 id="after-title" className="aw-h3">
            After a purchase
          </h2>
          <ul className="archive-benefit-list">
            {benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
