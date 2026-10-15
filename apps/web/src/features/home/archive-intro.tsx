import { Button, ScriptureRef } from "@awebound/brand";
import type { CSSProperties } from "react";
import { HeartIcon, LockIcon } from "@/components/icons";
import { homeIntro, lockedRows, type ArchiveOffer } from "@/features/archive/offer";
import type { ArchivePreview } from "@/server/archive/offer";

/**
 * My Archive on the home page, after the release wall: one paragraph on what the account keeps and
 * what a purchase opens, and one button, beside a preview of one design's card: a published one,
 * or the lead piece's public fields (its name, reference and what its art shows) until one is.
 * Its locked parts are named, never shown. Without any piece to preview, three of the release's
 * pieces saved with the heart.
 */
export function ArchiveIntro({
  offer,
  preview,
  plate,
  signedIn,
  owned,
  saved,
}: {
  offer: ArchiveOffer;
  preview: ArchivePreview | null;
  /** The previewed piece's plate color, as a CSS value. */
  plate: string | null;
  signedIn: boolean;
  /** The signed-in member owns the previewed design: its parts are open, not locked. */
  owned: boolean;
  /** Pieces to picture as saved in the short form: the release's first three with plates. */
  saved: { slug: string; plate: string }[];
}) {
  if (!offer.accounts) return null;
  const copy = homeIntro(offer, signedIn);
  const card = copy.full ? preview : null;
  const shelf = card || saved.length < 3 ? [] : saved.slice(0, 3);

  return (
    <section
      id="archive"
      className="archive-intro"
      data-full={Boolean(card) || shelf.length > 0}
      aria-labelledby="archive-intro-title"
    >
      <div className="aw-container archive-intro-in">
        <div className="archive-intro-words">
          <h2 id="archive-intro-title" className="aw-h1">
            {copy.title}
          </h2>
          <p className="aw-body archive-intro-lede">{copy.body}</p>
          <div className="aw-btn-row">
            <Button variant="secondary" href={copy.cta.href}>
              {copy.cta.label}
            </Button>
          </div>
        </div>

        {shelf.length > 0 ? (
          <figure className="archive-intro-saved">
            <div className="archive-intro-shelf">
              {shelf.map((p) => (
                <span
                  key={p.slug}
                  className="archive-intro-saved-piece"
                  style={{ "--plate": p.plate } as CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py */}
                  <img
                    src={`/products/${p.slug}/piece.webp`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="archive-tile-heart">
                    <HeartIcon size={18} filled />
                  </span>
                </span>
              ))}
            </div>
            <figcaption className="aw-small">
              Saved with the heart, there on every device you sign in to.
            </figcaption>
          </figure>
        ) : null}

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
                  {lockedRows(card.wallpapers).map((row) => (
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
