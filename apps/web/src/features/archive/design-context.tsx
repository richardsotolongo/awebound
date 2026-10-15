import type { PublicCard } from "@/shared";
import { BibleLink } from "./bible-link";

/**
 * The published public part of a design's Archive card on its product page: the preview and the
 * passage in context. The full story and the founder note stay behind a purchase, which the last
 * line mentions wherever accounts are open (`opens`).
 */
export function DesignContext({ card, opens }: { card: PublicCard; opens: boolean }) {
  return (
    <section id="story" className="aw-container details" aria-labelledby="story-title">
      <h2 id="story-title" className="aw-h2">
        The passage in context
      </h2>
      <div style={{ display: "grid", gap: "var(--space-4)", maxWidth: "62ch" }}>
        <p className="aw-body" style={{ color: "var(--ink)" }}>
          {card.publicPreview}
        </p>
        <p className="aw-body">{card.biblicalContext}</p>
        {card.contextReference && card.bibleUrl ? (
          <BibleLink href={card.bibleUrl} reference={card.contextReference} />
        ) : null}
        {opens ? (
          <p className="aw-small">
            The full story and a note from Richard open in My Archive when you buy the piece.
          </p>
        ) : null}
      </div>
    </section>
  );
}
