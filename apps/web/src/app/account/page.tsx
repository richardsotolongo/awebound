import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArchiveWelcome } from "@/features/archive/archive-welcome";
import { FoundingSeal } from "@/features/archive/founding-seal";
import { IdeaTile } from "@/features/archive/idea-tile";
import { welcomeFor } from "@/features/archive/offer";
import { listDesigns } from "@/server/archive/designs";
import { listEntitlements } from "@/server/archive/entitlements";
import { getFoundingForUser } from "@/server/archive/founding";
import { getIdeaAllowance } from "@/server/archive/ideas";
import { queueWelcomeIfNew } from "@/server/archive/email-outbox";
import { getArchiveOffer, getDesignWallpapers } from "@/server/archive/offer";
import { autoLinkByEmail } from "@/server/archive/orders";
import { getArchiveReadiness } from "@/server/archive/readiness";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "My Archive" };

/**
 * The overview: the welcome (always shown), then Idea Submissions in the feature color.
 * Your collection, Saved and Orders live in the navigation above (the owner's choice, October
 * 2026), so they have no tiles here.
 */
export default async function ArchivePage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount");
  await Promise.all([
    autoLinkByEmail(user).catch(() => 0),
    queueWelcomeIfNew(user).catch(() => undefined),
  ]);
  const [readiness, offer, entitlements, designs, founding, ideas] = await Promise.all([
    getArchiveReadiness(),
    getArchiveOffer(),
    listEntitlements(user.id),
    listDesigns(),
    getFoundingForUser(user.id),
    getIdeaAllowance(user).catch(() => null),
  ]);
  const owned = designs.filter((d) =>
    entitlements.some((e) => e.designKey === d.design_key && e.quantity > 0),
  );
  // Only a published design has a card to open.
  const opened = owned.filter((d) => d.published_content_id);
  const welcome = welcomeFor(
    offer,
    opened.map((d) => ({ slug: d.product_slug, name: d.name })),
    opened[0] ? await getDesignWallpapers(opened[0].product_slug, offer) : [],
  );

  return (
    <>
      <header className="page-header account-head">
        <h1 id="archive-title" className="visually-hidden">
          My Archive
        </h1>
        <p className="aw-small">
          Signed in as <span className="account-email">{user.email}</span>
        </p>
      </header>
      <ArchiveWelcome {...welcome} />
      {founding && readiness.founding ? <FoundingSeal /> : null}

      {ideas ? <IdeaTile allowance={ideas} /> : null}
    </>
  );
}
