import { Button, ScriptureRef } from "@awebound/brand";
import type { CSSProperties } from "react";
import { LockIcon } from "@/components/icons";
import { homeIntro, lockedRows, type ArchiveOffer } from "@/features/archive/offer";
import type { ArchivePreview } from "@/server/archive/offer";

/**
 * My Archive on the home page, after the release wall: what the account keeps and what a purchase
 * opens, beside a preview of one design's card. The preview holds only published public fields;
 * its locked parts are named, never shown. Before any story can open, a short form with no card.
 */
export function ArchiveIntro({
  offer,
  preview,
  plate,
  signedIn,
  owned,
}: {
  offer: ArchiveOffer;
  preview: ArchivePreview | null;
  /** The previewed piece's plate color, as a CSS value. */
  plate: string | null;
  signedIn: boolean;
  /** The signed-in member owns the previewed design: its parts are open, not locked. */
  owned: boolean;
}) {
  if (!offer.accounts) return null;
  const copy = homeIntro(offer, signedIn);
  const card = copy.full ? preview : null;

  return (
    <section
      id="archive"
      className="archive-intro"
      data-full={Boolean(card)}
      aria-labelledby="archive-intro-title"
    >
      <div className="aw-container archive-intro-in">
        <div className="archive-intro-words">
          <h2 id="archive-intro-title" className="aw-h1">
            {copy.title}
          </h2>
          <p className="aw-body archive-intro-lede">{copy.body}</p>
          {copy.points.length > 0 ? (
            <ul className="archive-intro-points">
              {copy.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
          <div className="aw-btn-row">
            <Button variant="secondary" href={copy.cta.href}>
              {copy.cta.label}
            </Button>
          </div>
        </div>

        {card ? (
          <figure className="archive-intro-card">
            <div
              className="archive-intro-media"
              style={plate ? ({ "--plate": plate } as CSSProperties) : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py for every piece */}
              <img
                src={`/products/${card.slug}/piece.webp`}
                alt=""
                width={960}
                height={1200}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="archive-intro-body">
              <p className="archive-intro-name">{card.name}</p>
              <ScriptureRef reference={card.scriptureReference} align="start" />
              <p className="archive-intro-preview">{card.publicPreview}</p>
              <div className="archive-intro-locked">
                <p className="aw-small">
                  {owned ? "Open in your Archive" : "Opens when you buy the piece"}
                </p>
                <ul>
                  {lockedRows(offer, card.wallpapers).map((row) => (
                    <li key={row}>
                      {owned ? null : <LockIcon size={16} />}
                      {row}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <figcaption className="aw-small">
              A preview of the {card.name} card in My Archive.
            </figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
