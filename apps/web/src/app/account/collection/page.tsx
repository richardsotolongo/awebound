import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { emptyCollection } from "@/features/archive/offer";
import { listPublishedPublicCards } from "@/server/archive/content";
import { listDesigns } from "@/server/archive/designs";
import { listEntitlements } from "@/server/archive/entitlements";
import { getArchiveOffer } from "@/server/archive/offer";
import { autoLinkByEmail } from "@/server/archive/orders";
import { getCatalog, getLatestRelease, withFallback } from "@/server/catalog";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Your collection" };

/**
 * The designs this account owns, one card each, and nothing else: pieces it doesn't own belong to
 * the shop. Empty, the page says why and gives one next step.
 */
export default async function CollectionPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Fcollection");
  // A guest order with this account's email counts here too, as on the overview.
  await autoLinkByEmail(user).catch(() => 0);
  const [designs, published, entitlements, catalog, offer, release] = await Promise.all([
    listDesigns(),
    listPublishedPublicCards(),
    listEntitlements(user.id),
    withFallback(getCatalog, null),
    getArchiveOffer(),
    withFallback(getLatestRelease, null),
  ]);
  const owned = designs.filter((d) =>
    entitlements.some((e) => e.designKey === d.design_key && e.quantity > 0),
  );
  const isPublished = new Set(published.map((c) => c.designKey));

  if (owned.length === 0) {
    return (
      <>
        <PageHeader title="Your collection" />
        <div className="shop-empty collection-empty" role="status">
          <p className="aw-h3">Your collection starts with your first piece.</p>
          {emptyCollection(offer).map((p) => (
            <p key={p} className="aw-body">
              {p}
            </p>
          ))}
          {offer.claims ? (
            <p className="aw-small">
              Bought with a different email?{" "}
              <Link href="/account/orders/link">Link that order</Link>.
            </p>
          ) : null}
          <div className="aw-btn-row">
            <Button variant="secondary" href="/shop">
              {release ? `Explore ${release.name}` : "Visit the shop"}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Your collection"
        intro={
          offer.stories
            ? "Each design you own, with its deeper story and a personal note from Richard."
            : "The designs you own."
        }
      />
      <ul className="archive-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {owned.map((d) => {
          const product = catalog?.findBySlug(d.product_slug) ?? null;
          const image = product?.image.url ?? `/products/${d.product_slug}/1.webp`;
          const open = isPublished.has(d.design_key);
          const href = open ? `/account/collection/${d.product_slug}` : `/shop/${d.product_slug}`;
          return (
            <li key={d.design_key} className="archive-card">
              <Link href={href} className="archive-card-media" aria-hidden="true" tabIndex={-1}>
                {/* eslint-disable-next-line @next/next/no-img-element -- site image */}
                <img src={image} alt="" />
              </Link>
              <p className="aw-product-name">{d.name}</p>
              <div className="archive-card-foot">
                <Button variant="link" href={href}>
                  {open ? "Open its story" : "View the piece"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
