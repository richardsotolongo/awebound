import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ArchiveWelcome } from "@/features/archive/archive-welcome";
import { FoundingSeal } from "@/features/archive/founding-seal";
import { welcomeFor } from "@/features/archive/offer";
import { listPublishedPublicCards } from "@/server/archive/content";
import { listDesigns } from "@/server/archive/designs";
import { queueWelcomeIfNew } from "@/server/archive/email-outbox";
import { listEntitlements } from "@/server/archive/entitlements";
import { getFoundingForUser } from "@/server/archive/founding";
import { getArchiveOffer } from "@/server/archive/offer";
import { autoLinkByEmail } from "@/server/archive/orders";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { getCatalog, getLatestRelease, withFallback } from "@/server/catalog";
import { currentUser } from "@/server/session";
import { collectionHref, pieceHref } from "@/shared";

export const metadata: Metadata = { title: "My Archive" };

/**
 * My Archive's landing page, the Collection tab: the designs this account owns, one card each.
 * Empty, the welcome on bone paper says what a design opens and gives one next step.
 */
export default async function ArchivePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount");
  // A guest order with this account's email counts here too.
  await Promise.all([
    autoLinkByEmail(user).catch(() => 0),
    queueWelcomeIfNew(user).catch(() => undefined),
  ]);
  const [readiness, offer, designs, published, entitlements, catalog, founding, release] =
    await Promise.all([
      getArchiveReadiness(),
      getArchiveOffer(),
      listDesigns(),
      listPublishedPublicCards(),
      listEntitlements(user.id),
      withFallback(getCatalog, null),
      getFoundingForUser(user.id),
      withFallback(getLatestRelease, null),
    ]);
  const owned = designs.filter((d) =>
    entitlements.some((e) => e.designKey === d.design_key && e.quantity > 0),
  );
  const isPublished = new Set(published.map((c) => c.designKey));
  const seal = founding && readiness.founding ? <FoundingSeal /> : null;

  if (owned.length === 0) {
    return (
      <>
        <PageHeader title="Your collection" hideTitle />
        <ArchiveWelcome
          {...welcomeFor(offer)}
          explore={
            release
              ? { href: "/shop", label: `Explore ${release.name}` }
              : { href: "/shop", label: "Visit the shop" }
          }
          claims={offer.claims}
        />
        {seal}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Your collection"
        hideTitle
        intro={
          offer.stories
            ? "Each design you own, with its story and a note from Richard."
            : "The designs you own."
        }
      />
      {seal}
      <ul className="archive-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {owned.map((d) => {
          const product = catalog?.findBySlug(d.product_slug) ?? null;
          const image = product?.image.url ?? `/products/${d.product_slug}/1.webp`;
          const open = isPublished.has(d.design_key);
          const href = open ? collectionHref(d.product_slug) : pieceHref(d.product_slug);
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
