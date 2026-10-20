"use client";

import { useEffect, useId, useState, type MouseEvent, type PointerEvent } from "react";
import { LockIcon } from "@/components/icons";
import { IDEA_EVERY, IDEA_FIRST_AT, plural, type IdeaAllowance } from "@/shared";

/** Five marks for the purchases toward the first submission, filled as they come. */
export function IdeaProgress({ purchases }: { purchases: number }) {
  const done = Math.min(purchases, IDEA_FIRST_AT);
  return (
    <div className="idea-progress">
      <span className="idea-pips" aria-hidden="true">
        {Array.from({ length: IDEA_FIRST_AT }, (_, i) => (
          <span key={i} data-on={i < done || undefined} />
        ))}
      </span>
      <span className="idea-progress-text">
        {done} of {IDEA_FIRST_AT} purchases
      </span>
    </div>
  );
}

/** Why the tile is locked, and how it opens. */
export function IdeaLockReason() {
  return (
    <>
      <p>
        Ideas open after {IDEA_FIRST_AT} purchases made while signed in, so each one gets the
        attention it deserves. After that, every {IDEA_EVERY} more purchases open another.
      </p>
      <p className="idea-fine">
        A purchase is one paid order. A full refund or cancellation doesn’t count.
      </p>
    </>
  );
}

/**
 * Idea Submissions, at the top of the Ideas tab in the feature color. Locked until the account has
 * 5 purchases; the reason shows while a mouse rests on the tile, or on a tap (the lock button does
 * the same from the keyboard), in place of the tile's own words, so nothing below it moves. The
 * page passes the allowance to show, so its owner switch decides how the tile looks too.
 */
export function IdeaTile({ allowance }: { allowance: IdeaAllowance }) {
  const id = useId();
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const locked = !allowance.unlocked;
  const open = locked && (hover || pinned);

  useEffect(() => {
    if (!pinned) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [pinned]);

  const mouse = (on: boolean) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") setHover(on);
  };
  // A tap anywhere on a locked tile shows the reason (the lock button handles its own clicks).
  const tap = (e: MouseEvent) => {
    if (!locked || (e.target as HTMLElement).closest("a, button")) return;
    setPinned((p) => !p);
  };

  const status = allowance.owner
    ? "Open to you as the owner. Your test ideas aren’t counted."
    : allowance.founding
      ? allowance.remaining > 0
        ? `Open to you as ${allowance.honorary ? "an honorary member" : "a Founding Member"}. Send an idea whenever you like, one at a time.`
        : "Your idea is with us. Your next one opens once we’ve reviewed it."
      : !allowance.unlocked
        ? `Opens after ${IDEA_FIRST_AT} purchases made while signed in.`
        : allowance.remaining > 0
          ? `Unlocked. You have ${plural(allowance.remaining, "submission")} open.`
          : `Your idea is with us. ${plural(allowance.toNext, "more purchase")} ${allowance.toNext === 1 ? "opens" : "open"} your next submission.`;

  return (
    <div className="idea-tile-row">
      <section
        className="idea-tile"
        data-locked={locked || undefined}
        aria-labelledby={`${id}-title`}
        onPointerEnter={mouse(true)}
        onPointerLeave={mouse(false)}
        onClick={tap}
      >
        <div className="idea-tile-head">
          <h2 id={`${id}-title`} className="aw-h3">
            Idea Submissions
          </h2>
          {locked ? (
            <button
              type="button"
              className="idea-lock"
              aria-expanded={open}
              aria-controls={`${id}-why`}
              onClick={() => setPinned((p) => !p)}
            >
              <LockIcon size={16} />
              Why it’s locked
            </button>
          ) : null}
        </div>

        <div className="idea-tile-stack">
          <div className="idea-tile-face" inert={open} data-hidden={open || undefined}>
            <p className="aw-body">
              Have a verse you’d wear? Send us your idea for a piece. If we choose it, we make it,
              and your piece is free.
            </p>
            {status ? <p className="idea-status">{status}</p> : null}
            {locked ? <IdeaProgress purchases={allowance.purchases} /> : null}
          </div>

          {locked ? (
            <div
              id={`${id}-why`}
              className="idea-tile-why"
              inert={!open}
              data-hidden={!open || undefined}
            >
              <IdeaLockReason />
              <IdeaProgress purchases={allowance.purchases} />
              {pinned ? (
                <button type="button" className="idea-close" onClick={() => setPinned(false)}>
                  Close
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
