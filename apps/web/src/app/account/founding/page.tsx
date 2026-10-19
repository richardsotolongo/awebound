import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FoundingView } from "@/features/archive/founding-view";
import { getFoundingForUser } from "@/server/archive/founding";
import { currentUser, hasRole } from "@/server/session";

export const metadata: Metadata = { title: "Founding Member" };

/** A sample place for the owner, who sees the tab as a member does (the owner's choice). */
const OWNER_SAMPLE_RANK = 12;

/**
 * The Founding tab, for the first 50 buyers who used their account at checkout. The owner sees it
 * too, with a sample place, to check how it looks; anyone else goes back to Collection.
 */
export default async function FoundingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Ffounding");
  const [founding, owner] = await Promise.all([
    getFoundingForUser(user.id).catch(() => null),
    hasRole(user, "admin"),
  ]);
  if (!founding && !owner) redirect("/account");
  return (
    <>
      <PageHeader title="Founding Member" hideTitle />
      <FoundingView rank={founding?.rank ?? OWNER_SAMPLE_RANK} sample={!founding} />
    </>
  );
}
