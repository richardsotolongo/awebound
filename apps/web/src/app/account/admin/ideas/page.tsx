import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { IdeaCard } from "@/features/archive/admin/idea-card";
import { ideaCounts, listIdeas } from "@/server/archive/ideas";
import { CONTACT_EMAIL, IDEA_STATUS_LABELS, IDEA_STATUSES, IdeaStatusSchema } from "@/shared";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ideas", robots: { index: false } };

/** Idea Submissions from shoppers with enough purchases: newest first, filtered by status. */
export default async function IdeasInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const parsed = IdeaStatusSchema.safeParse((await searchParams).status);
  const status = parsed.success ? parsed.data : null;
  const [ideas, counts] = await Promise.all([listIdeas(status), ideaCounts()]);
  const total = IDEA_STATUSES.reduce((n, s) => n + counts[s], 0);
  const filters: [string, string, number][] = [
    ["All", "/account/admin/ideas", total],
    ...IDEA_STATUSES.map((s): [string, string, number] => [
      IDEA_STATUS_LABELS[s].owner,
      `/account/admin/ideas?status=${s}`,
      counts[s],
    ]),
  ];

  return (
    <>
      <PageHeader
        title="Ideas"
        intro={`Idea Submissions from My Archive, newest first. Each one is also emailed to ${CONTACT_EMAIL} with its image attached; reply there to reach the person who sent it. Mark the one you choose as Selected: their piece is free.`}
      />

      <nav aria-label="Filter by status" className="admin-filter">
        {filters.map(([label, href, n]) => {
          const current =
            (status ? `/account/admin/ideas?status=${status}` : "/account/admin/ideas") === href;
          return (
            <Link key={href} href={href} aria-current={current ? "page" : undefined}>
              {label} ({n})
            </Link>
          );
        })}
      </nav>

      <section className="admin-section" aria-label="Submissions">
        {ideas.length === 0 ? (
          <p className="aw-body">
            {total === 0
              ? "No ideas yet. They arrive here once shoppers reach 5 purchases."
              : "Nothing with this status."}
          </p>
        ) : (
          <div className="admin-ideas">
            {ideas.map((s) => (
              <IdeaCard key={s.id} idea={s} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
