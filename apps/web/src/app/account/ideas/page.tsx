import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { IdeaForm } from "@/features/archive/idea-form";
import { IdeaLockReason, IdeaProgress } from "@/features/archive/idea-tile";
import { getIdeaAllowance, listIdeasForUser } from "@/server/archive/ideas";
import { currentUser } from "@/server/session";
import Link from "next/link";
import { IDEA_EVERY, IDEA_FIRST_AT, IDEA_STATUS_LABELS, ideaAllowance, plural } from "@/shared";

export const metadata: Metadata = { title: "Idea Submissions" };

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/**
 * Idea Submissions: the form once a submission is open, the reason while it's locked, and the
 * account's own ideas. The owner always has the form, and can see the locked page as a customer
 * does with `?view=customer` (the switch at the top, shown to the owner only).
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
      <PageHeader
        title="Idea Submissions"
        intro={
          <p>
            Bring us a design idea for an Awebound piece: an image, what you picture, the verse it
            carries and its context. If we choose your idea, we make it, and your piece is free.
          </p>
        }
      />

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

      {allowance.remaining > 0 ? (
        <section className="idea-page-section" aria-label="Send an idea">
          <IdeaForm email={user.email ?? "your account email"} owner={allowance.owner} />
        </section>
      ) : !allowance.unlocked ? (
        <section className="idea-page-section idea-locked" aria-labelledby="locked-title">
          <h2 id="locked-title" className="aw-h3">
            Locked for now
          </h2>
          <div className="idea-reason">
            <IdeaLockReason />
          </div>
          <IdeaProgress purchases={allowance.purchases} />
          <div>
            <Button variant="secondary" href="/shop">
              Visit the shop
            </Button>
          </div>
        </section>
      ) : (
        <section className="idea-page-section notice" aria-labelledby="next-title">
          <h2 id="next-title" className="aw-h3">
            Your next submission
          </h2>
          <p className="aw-body">
            {plural(allowance.toNext, "more purchase")} {allowance.toNext === 1 ? "opens" : "open"}{" "}
            your next submission. After your first idea, every {IDEA_EVERY} more purchases open
            another.
          </p>
        </section>
      )}

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
