import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FoundingView } from "@/features/archive/founding-view";
import { getFoundingForUser } from "@/server/archive/founding";
import { currentUser, hasRole } from "@/server/session";

export const metadata: Metadata = { title: "Founding Member" };

/** A sample place for the owner, who sees the tab as a member does (the owner's choice). */
const OWNER_SAMPLE_RANK = 12;

/**
 * The Founding tab, for the first 50 buyers who used their account at checkout and for honorary
 * members. The owner sees it too, as either (?view=honorary), to check how it looks; anyone else
 * goes back to Collection.
 */
export default async function FoundingPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Ffounding");
  const [founding, owner, { view }] = await Promise.all([
    getFoundingForUser(user.id).catch(() => null),
    hasRole(user, "admin"),
    searchParams,
  ]);
  if (!founding && !owner) redirect("/account");
  const honoraryView = view === "honorary";
  return (
    <>
      <PageHeader title="Founding Member" hideTitle />
      {!founding ? (
        <nav className="idea-owner-view idea-owner-view-page" aria-label="See this page as">
          <span>Owner only. See this page as:</span>
          <Link href="/account/founding" aria-current={!honoraryView ? "page" : undefined}>
            Founding (No. {OWNER_SAMPLE_RANK})
          </Link>
          <Link
            href="/account/founding?view=honorary"
            aria-current={honoraryView ? "page" : undefined}
          >
            Honorary
          </Link>
        </nav>
      ) : null}
      <FoundingView
        rank={founding ? founding.rank : honoraryView ? null : OWNER_SAMPLE_RANK}
        sample={!founding}
      />
    </>
  );
}
