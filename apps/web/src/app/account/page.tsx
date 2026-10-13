import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { purchaseBenefits } from "@/features/archive/benefits-list";
import { FoundingSeal } from "@/features/archive/founding-seal";
import { listDesigns } from "@/server/archive/designs";
import { listEntitlements } from "@/server/archive/entitlements";
import { getFitPreferences, listFitGuides } from "@/server/archive/fit";
import { getFoundingForUser } from "@/server/archive/founding";
import { queueWelcomeIfNew } from "@/server/archive/email-outbox";
import { autoLinkByEmail, listOrdersForUser } from "@/server/archive/orders";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { listSavedPieces } from "@/server/archive/saved";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "My Archive" };

const SYNC = {
  confirmed: "Payment confirmed",
  pending: "We’re confirming this order with our checkout partner.",
  revoked: "Cancelled or refunded",
} as const;

export default async function ArchivePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount");
  await Promise.all([autoLinkByEmail(user).catch(() => 0), queueWelcomeIfNew(user).catch(() => undefined)]);
  const [readiness, saved, fit, guides, entitlements, designs, orders, founding] = await Promise.all([
    getArchiveReadiness(),
    listSavedPieces(user.id),
    getFitPreferences(user.id),
    Promise.resolve(listFitGuides()),
    listEntitlements(user.id),
    listDesigns(),
    listOrdersForUser(user.id),
    getFoundingForUser(user.id),
  ]);
  const owned = designs.filter((d) => entitlements.some((e) => e.designKey === d.design_key && e.quantity > 0));
  const empty = saved.length === 0 && fit.length === 0 && orders.length === 0 && owned.length === 0;

  return (
    <>
      <PageHeader
        title="My Archive"
        note={`Signed in as ${user.email ?? ""}`}
        intro={
          empty
            ? "Your Archive is open. Save a piece, set your fit, and explore Behold. The full stories and extras for your purchased designs will appear here after payment is confirmed."
            : undefined
        }
      />
      {founding && readiness.founding ? <FoundingSeal /> : null}

      <div className="account-panels">
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
              <div>
                <Button variant="link" href="/account/saved">
                  See your saved pieces
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="aw-body">Nothing saved yet.</p>
              <div>
                <Button variant="secondary" href="/shop">
                  Visit the shop
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="account-panel" aria-labelledby="fit-title">
          <h2 id="fit-title" className="aw-h3">
            Your fit
          </h2>
          {fit.length > 0 ? (
            <ul className="archive-panel-list">
              {fit.map((f) => {
                const guide = guides.find((g) => g.id === f.guideId);
                return (
                  <li key={f.guideId} className="aw-body">
                    {guide?.name ?? f.guideId}: {f.size ?? f.note ?? "noted"}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="aw-body">No fit saved yet.</p>
          )}
          <div>
            <Button variant="link" href="/account/fit">
              {fit.length > 0 ? "Change your fit" : "Set your fit"}
            </Button>
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
          <div>
            <Button variant="link" href={owned.length > 0 ? "/account/collection" : "/collections/behold"}>
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
              Order history isn’t connected yet. Order confirmations and tracking still come by email.
            </p>
          ) : orders.length > 0 ? (
            <ul className="archive-panel-list">
              {orders.slice(0, 3).map((o) => (
                <li key={o.id} className="aw-body">
                  Order {o.friendlyId ?? o.id}: {SYNC[o.sync]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="aw-body">No orders linked yet.</p>
          )}
          <div className="account-actions">
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

        {owned.length === 0 && purchaseBenefits(readiness).length > 0 ? (
          <section className="account-panel" aria-labelledby="after-title">
            <h2 id="after-title" className="aw-h3">
              After a purchase
            </h2>
            <ul className="archive-panel-list" style={{ paddingLeft: "1.2em", listStyle: "disc", color: "var(--ink-muted)" }}>
              {purchaseBenefits(readiness).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
