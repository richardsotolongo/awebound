import type { CSSProperties } from "react";
import Link from "next/link";
import { plateCss, pieceHref, type ProductSummary } from "@/shared";
import { ArrowRightIcon } from "@/components/icons";

/**
 * The pieces before and after this one in the release, each shown whole beside its name. The
 * links carry a direction, so the next piece arrives from its side (view transitions, site.css).
 * `id` marks where the page turns from this piece to the others: the phone buy bar stops there.
 */
export function PieceNav({ prev, next }: { prev?: ProductSummary; next?: ProductSummary }) {
  if (!prev && !next) return null;
  const tile = (piece: ProductSummary, direction: "prev" | "next") => (
    <Link
      href={pieceHref(piece.slug)}
      rel={direction}
      className="piece-nav-link"
      data-direction={direction}
      transitionTypes={[direction === "next" ? "nav-forward" : "nav-back"]}
      aria-label={`${direction === "next" ? "Next" : "Previous"} piece: ${piece.name}`}
      style={{ "--plate": plateCss(piece.plate) } as CSSProperties}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN */}
      <img src={piece.image.url} alt="" loading="lazy" decoding="async" />
      <span className="piece-nav-words">
        <ArrowRightIcon size={22} />
        <span className="aw-product-name">{piece.name}</span>
      </span>
    </Link>
  );
  return (
    <nav id="other-pieces" className="piece-nav" aria-label="Other pieces in this release">
      {prev ? tile(prev, "prev") : <span />}
      {next ? tile(next, "next") : <span />}
    </nav>
  );
}
