import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArchiveWelcome } from "@/features/archive/archive-welcome";
import { FoundingSeal } from "@/features/archive/founding-seal";
import { IdeaTile } from "@/features/archive/idea-tile";
import { WELCOME_COOKIE, welcomeFor } from "@/features/archive/offer";
import { listDesigns } from "@/server/archive/designs";
import { listEntitlements } from "@/server/archive/entitlements";
import { getFoundingForUser } from "@/server/archive/founding";
import { getIdeaAllowance } from "@/server/archive/ideas";
import { queueWelcomeIfNew } from "@/server/archive/email-outbox";
import { getArchiveOffer, getDesignWallpapers } from "@/server/archive/offer";
import { autoLinkByEmail } from "@/server/archive/orders";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { currentUser } from "@/server/session";
import { collectionHref } from "@/shared";

export const metadata: Metadata = { title: "My Archive" };

/**
 * The overview: the welcome (until it is dismissed), then two tiles side by side: Your collection
 * and Idea Submissions, wider and in the feature color. Saved and Orders live in the navigation
 * above (the owner's choice, October 2026), so they have no tiles here.
 */
export default async function ArchivePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount");
  await Promise.all([
    autoLinkByEmail(user).catch(() => 0),
    queueWelcomeIfNew(user).catch(() => undefined),
  ]);
  const [readiness, offer, entitlements, designs, founding, ideas, jar] = await Promise.all([
    getArchiveReadiness(),
    getArchiveOffer(),
    listEntitlements(user.id),
    listDesigns(),
    getFoundingForUser(user.id),
    getIdeaAllowance(user).catch(() => null),
    cookies(),
  ]);
  const owned = designs.filter((d) =>
    entitlements.some((e) => e.designKey === d.design_key && e.quantity > 0),
  );
  // Only a published design has a card to open.
  const opened = owned.filter((d) => d.published_content_id);
  const welcome = welcomeFor(
    offer,
    jar.get(WELCOME_COOKIE)?.value,
    opened.map((d) => ({ slug: d.product_slug, name: d.name })),
    opened[0] ? await getDesignWallpapers(opened[0].product_slug, offer) : [],
  );

  return (
    <>
      <header className="page-header account-head">
        <h1 id="archive-title" className="visually-hidden" tabIndex={-1}>
          My Archive
        </h1>
        <p className="aw-small">
          Signed in as <span className="account-email">{user.email}</span>
        </p>
      </header>
      {welcome ? <ArchiveWelcome {...welcome} /> : null}
      {founding && readiness.founding ? <FoundingSeal /> : null}

      <div className="archive-overview">
        <section className="account-panel" aria-labelledby="collection-title">
          <h2 id="collection-title" className="aw-h3">
            Your collection
          </h2>
          {owned.length > 0 ? (
            <ul className="archive-panel-list">
              {owned.map((d) => (
                <li key={d.design_key}>
                  {d.published_content_id ? (
                    <Link href={collectionHref(d.product_slug)}>{d.name}</Link>
                  ) : (
                    d.name
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="aw-body">Your collection starts with your first piece.</p>
          )}
          <div className="account-panel-foot">
            <Button variant="link" href="/account/collection">
              Open your collection
            </Button>
          </div>
        </section>

        {ideas ? <IdeaTile allowance={ideas} /> : null}
      </div>
    </>
  );
}
