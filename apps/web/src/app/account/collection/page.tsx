import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { listPublishedPublicCards } from "@/server/archive/content";
import { listDesigns } from "@/server/archive/designs";
import { listEntitlements } from "@/server/archive/entitlements";
import { getCatalog, withFallback } from "@/server/catalog";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Your collection" };

export default async function CollectionPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Fcollection");
  const [designs, published, entitlements, catalog] = await Promise.all([
    listDesigns(),
    listPublishedPublicCards(),
    listEntitlements(user.id),
    withFallback(getCatalog, null),
  ]);
  const owned = new Set(entitlements.filter((e) => e.quantity > 0).map((e) => e.designKey));
  const isPublished = new Set(published.map((c) => c.designKey));
  return (
    <>
      <PageHeader
        title="Your collection"
        intro={
          owned.size > 0
            ? "One card per design you own, with its full story and extras."
            : "Your collection starts with your first piece."
        }
      />
      {designs.length === 0 ? (
        <div className="aw-btn-row">
          <Button variant="secondary" href="/shop">
            Visit the shop
          </Button>
        </div>
      ) : (
        <ul className="archive-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {designs.map((d) => {
            const product = catalog?.findBySlug(d.product_slug) ?? null;
            const image = product?.image.url ?? `/products/${d.product_slug}/1.webp`;
            const has = owned.has(d.design_key);
            const published = isPublished.has(d.design_key);
            return (
              <li key={d.design_key} className="archive-card">
                <div className="archive-card-media">
                  {has && published ? (
                    <Link
                      href={`/account/collection/${d.product_slug}`}
                      aria-label={`${d.name}, owned`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- site image */}
                      <img src={image} alt="" />
                    </Link>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- site image
                    <img src={image} alt="" />
                  )}
                </div>
                <p className="aw-product-name">{d.name}</p>
                {has && published ? (
                  <Button variant="link" href={`/account/collection/${d.product_slug}`}>
                    Open its story
                  </Button>
                ) : (
                  <>
                    {has ? <p className="aw-small">Owned</p> : null}
                    {!has && published ? (
                      <p className="aw-small">
                        Own this design to unlock its full story and founder note.
                      </p>
                    ) : null}
                    <Button variant="link" href={`/shop/${d.product_slug}`}>
                      View the piece
                    </Button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
