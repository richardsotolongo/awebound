import { ScriptureQuote } from "@awebound/brand";
import type { CSSProperties, ReactNode } from "react";
import { HeartIcon, LockIcon } from "@/components/icons";
import type { Media, ScriptureQuote as Quote } from "@/shared";
import {
  FOUNDING_LINE,
  PURCHASE_NOTE,
  archiveTiles,
  type ArchiveOffer,
  type ArchiveTile,
  type TileKind,
} from "./offer";

/** A piece the tiles can picture: its cut-out garment on its plate color. */
export interface TilePiece {
  slug: string;
  name: string;
  /** The plate color as a CSS value. */
  plate: string;
  reference: string;
  media: Media;
}

function Garment({ piece, className }: { piece: TilePiece; className?: string }) {
  return (
    <span className={className} style={{ "--plate": piece.plate } as CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py */}
      <img src={piece.media.piece} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="archive-tile-badge">{children}</span>;
}

/** Each tile's picture, drawn from the release's own pieces. Decorative: the words say it all. */
function Visual({
  kind,
  pieces,
  quote,
}: {
  kind: TileKind;
  pieces: TilePiece[];
  quote: Quote | null;
}) {
  const [lead, ...rest] = pieces;
  const few = rest.length >= 3 ? rest.slice(0, 3) : pieces.slice(0, 3);
  if (!lead) return <span className="archive-tile-visual" />;
  switch (kind) {
    case "save":
      return (
        <span
          className="archive-tile-visual archive-tile-plate"
          style={{ "--plate": lead.plate } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py */}
          <img className="archive-tile-garment" src={lead.media.piece} alt="" loading="lazy" />
          <span className="archive-tile-heart">
            <HeartIcon size={18} filled />
          </span>
        </span>
      );
    case "devices":
      return (
        <span className="archive-tile-visual archive-tile-devices">
          <span className="archive-device archive-device-laptop">
            {few.map((p) => (
              <Garment key={p.slug} piece={p} className="archive-device-tile" />
            ))}
          </span>
          <span className="archive-device archive-device-phone">
            {few.slice(0, 2).map((p) => (
              <Garment key={p.slug} piece={p} className="archive-device-tile" />
            ))}
          </span>
        </span>
      );
    case "orders":
      return (
        <span className="archive-tile-visual archive-tile-orders">
          {few.slice(0, 2).map((p) => (
            <span key={p.slug} className="archive-tile-order">
              <Garment piece={p} className="archive-tile-thumb" />
              <span className="archive-tile-lines">
                <span />
                <span />
              </span>
            </span>
          ))}
        </span>
      );
    case "open":
      return (
        <span className="archive-tile-visual archive-tile-verse">
          {quote ? (
            <ScriptureQuote
              text={quote.text}
              reference={quote.reference}
              translation={quote.translation}
              excerpt={quote.excerpt}
              size="sm"
            />
          ) : null}
        </span>
      );
    case "story":
      return (
        <span
          className="archive-tile-visual archive-tile-detail"
          style={{ "--plate": lead.plate } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py */}
          <img src={lead.media.detail} alt="" loading="lazy" />
          <Badge>
            <LockIcon size={14} />
          </Badge>
        </span>
      );
    case "note":
      return (
        <span className="archive-tile-visual archive-tile-note">
          {/* eslint-disable-next-line @next/next/no-img-element -- static portrait */}
          <img src="/about/richard-480.webp" alt="" loading="lazy" />
          <span className="archive-tile-lines">
            <span />
            <span />
            <span />
            <span />
          </span>
          <Badge>
            <LockIcon size={14} />
          </Badge>
        </span>
      );
    case "card":
      return (
        <span className="archive-tile-visual archive-tile-mini">
          <Garment piece={lead} className="archive-mini-plate" />
          <span className="archive-mini-label">
            <span className="archive-mini-name">{lead.name}</span>
            <span className="archive-mini-ref">{lead.reference}</span>
          </span>
        </span>
      );
    case "extras": {
      const p = rest[0] ?? lead;
      return (
        <span className="archive-tile-visual archive-tile-devices">
          <span
            className="archive-device archive-device-wallpaper"
            style={{ "--plate": p.plate } as CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py */}
            <img src={p.media.piece} alt="" loading="lazy" />
          </span>
          <span className="archive-device archive-device-doc">
            <span />
            <span />
            <span />
          </span>
        </span>
      );
    }
  }
}

function Tiles({
  tiles,
  pieces,
  quote,
  label,
}: {
  tiles: ArchiveTile[];
  pieces: TilePiece[];
  quote: Quote | null;
  label: string;
}) {
  return (
    <ul className="archive-tiles" aria-label={label}>
      {tiles.map((t) => (
        <li key={t.kind} className="archive-tile">
          <Visual kind={t.kind} pieces={pieces} quote={quote} />
          <span className="archive-tile-words">
            <span className="archive-tile-title">{t.title}</span>
            <span className="archive-tile-body">{t.body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Sign-in: what My Archive holds, as tiles with pictures drawn from the release's own pieces, in
 * two groups kept apart: what the account includes, and what each design bought with it opens
 * (the deeper story, Richard's note, the Scripture and biblical context, wallpapers and extras).
 * Its parts are pictured, never shown: the note is suggested by lines, and nothing of a design's
 * protected content reaches the page.
 */
export function BenefitsList({
  offer,
  pieces,
  quote,
}: {
  offer: ArchiveOffer;
  /** The release's pieces in order, the lead piece first. */
  pieces: TilePiece[];
  /** A verse to picture "Open to everyone". */
  quote: Quote | null;
}) {
  const { free, purchase } = archiveTiles(offer);
  if (free.length === 0) return null;
  return (
    <section className="archive-benefits" aria-labelledby="benefits-title">
      <div className="archive-benefits-head">
        <h2 id="benefits-title" className="aw-h2">
          {purchase.length > 0 ? "Wear the piece. Know its story." : "Keep the pieces you love."}
        </h2>
        <p className="aw-body">
          My Archive is your personal space for the Awebound pieces you love.
        </p>
      </div>
      <div className="archive-benefit-group">
        <h3 className="aw-h3">Included with your account</h3>
        <Tiles tiles={free} pieces={pieces} quote={quote} label="Included with your account" />
      </div>
      {purchase.length > 0 ? (
        <div className="archive-benefit-group">
          <h3 className="aw-h3">With each design you buy</h3>
          <Tiles tiles={purchase} pieces={pieces} quote={quote} label="With each design you buy" />
          <p className="aw-small">{PURCHASE_NOTE}</p>
        </div>
      ) : null}
      {offer.foundingOpen ? <p className="aw-small">{FOUNDING_LINE}</p> : null}
    </section>
  );
}
