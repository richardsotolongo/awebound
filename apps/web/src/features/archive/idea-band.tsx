import { Button } from "@awebound/brand";
import type { IdeaAllowance } from "@/shared";
import { plural } from "@/shared";
import { IdeaProgress } from "./idea-tile";

/**
 * Idea Submissions showcased on the Collection tab: one slim band in the feature color with a gold
 * rule, so the Archive's one distinct feature is seen where people land, not only behind its tab.
 * Where the account stands sits on the right with the way in.
 */
export function IdeaBand({ allowance }: { allowance: IdeaAllowance }) {
  const status = allowance.owner
    ? "Open to you as the owner."
    : allowance.founding
      ? allowance.remaining > 0
        ? `Open to you as ${allowance.honorary ? "an honorary member" : "a Founding Member"}.`
        : "Your next idea opens once we’ve reviewed this one."
      : !allowance.unlocked
        ? null
        : allowance.remaining > 0
          ? `You have ${plural(allowance.remaining, "submission")} open.`
          : `${plural(allowance.toNext, "more purchase")} ${allowance.toNext === 1 ? "opens" : "open"} your next one.`;
  return (
    <section className="idea-band" aria-labelledby="idea-band-title">
      <div className="idea-band-words">
        <h2 id="idea-band-title" className="aw-h3">
          Idea Submissions
        </h2>
        <p className="aw-body">
          Have a verse you’d wear? Send us your design idea. If we choose it, we make it, and your
          piece is free.
        </p>
      </div>
      <div className="idea-band-side">
        {allowance.unlocked ? (
          <p className="idea-status">{status}</p>
        ) : (
          <IdeaProgress purchases={allowance.purchases} />
        )}
        <Button variant="on-feature" href="/account/ideas">
          {allowance.remaining > 0 ? "Submit an idea" : "See how it works"}
        </Button>
      </div>
    </section>
  );
}
