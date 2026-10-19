import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { IdeaForm } from "@/features/archive/idea-form";
import { IdeaTile } from "@/features/archive/idea-tile";
import { getIdeaAllowance, listIdeasForUser } from "@/server/archive/ideas";
import { currentUser } from "@/server/session";
import Link from "next/link";
import { IDEA_FIRST_AT, IDEA_STATUS_LABELS, ideaAllowance } from "@/shared";

export const metadata: Metadata = { title: "Idea Submissions" };

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/**
 * The Ideas tab: the Idea Submissions tile (what it is, where the account stands, why it's
 * locked), the form once a submission is open, and the account's own ideas. The owner always has
 * the form, and can see the page as a customer does with `?view=customer` (the switch at the top,
 * shown to the owner only).
 */
export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; sent?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Fideas");
  const [real, ideas, { view, sent }] = await Promise.all([
    getIdeaAllowance(user),
    listIdeasForUser(user.id),
    searchParams,
  ]);
  const asCustomer = real.owner && view === "customer";
  const allowance = asCustomer
    ? ideaAllowance(Math.min(real.purchases, IDEA_FIRST_AT - 1), 0)
    : real;

  return (
    <>
      <PageHeader title="Idea Submissions" hideTitle />

      {sent ? (
        <div className="notice idea-page-section" role="status">
          <p className="aw-h3">Thank you</p>
          <p className="aw-body">
            Your idea is with us. If we choose it, we’ll write to you at {user.email} before
            anything is made, and your piece is free.
          </p>
        </div>
      ) : null}

      {real.owner ? (
        <nav className="idea-owner-view idea-owner-view-page" aria-label="See this page as">
          <span>Owner only. See this page as:</span>
          <Link href="/account/ideas" aria-current={!asCustomer ? "page" : undefined}>
            Owner (open)
          </Link>
          <Link href="/account/ideas?view=customer" aria-current={asCustomer ? "page" : undefined}>
            Customer (locked)
          </Link>
        </nav>
      ) : null}

      <IdeaTile allowance={allowance} />

      {allowance.remaining > 0 ? (
        <section className="idea-page-section" aria-label="Send an idea">
          <IdeaForm email={user.email ?? "your account email"} owner={allowance.owner} />
        </section>
      ) : !allowance.unlocked ? (
        <div className="idea-page-section">
          <Button variant="secondary" href="/shop">
            Visit the shop
          </Button>
        </div>
      ) : null}

      {ideas.length > 0 ? (
        <section className="idea-page-section" aria-labelledby="mine-title">
          <h2 id="mine-title" className="aw-h3">
            Your ideas
          </h2>
          <ul className="idea-mine">
            {ideas.map((idea) => (
              <li key={idea.id} className="idea-mine-item">
                {idea.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a short-lived signed URL to the shopper's own upload
                  <img
                    src={idea.imageUrl}
                    alt="Your submitted design"
                    className="idea-mine-image"
                  />
                ) : null}
                <div className="idea-mine-words">
                  <p className="aw-small">
                    Sent {date(idea.createdAt)} ·{" "}
                    <span className="idea-state" data-status={idea.status}>
                      {IDEA_STATUS_LABELS[idea.status].shopper}
                    </span>
                  </p>
                  {idea.verse ? <p className="idea-mine-verse">{idea.verse}</p> : null}
                  {idea.idea ? <p className="aw-body idea-text">{idea.idea}</p> : null}
                  {idea.context ? <p className="aw-small idea-text">{idea.context}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
