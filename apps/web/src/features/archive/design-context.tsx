import type { PublicCard } from "@/shared";

/**
 * The published public part of a design's Archive card on its product page: the preview and the
 * passage in context. The full story and the founder note stay behind a purchase.
 */
export function DesignContext({ card }: { card: PublicCard }) {
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
        {card.contextReference ? (
          <p className="aw-small">
            {card.bibleUrl ? (
              <a href={card.bibleUrl} rel="noopener">
                Read {card.contextReference} (NIV)
              </a>
            ) : (
              <>Read {card.contextReference}.</>
            )}
          </p>
        ) : null}
        <p className="aw-small">
          The full story and a note from Richard unlock in My Archive after purchase.
        </p>
      </div>
    </section>
  );
}
