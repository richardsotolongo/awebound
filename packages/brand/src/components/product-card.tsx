"use client";

import * as React from "react";
import { useState, type CSSProperties } from "react";
import { cx } from "../cx";
import { BrandLink } from "../link";
import { ScriptureQuote } from "./scripture-quote";

/** React 19.3 has ViewTransition; on an older React the image simply renders as it is. */
const Morph: typeof React.ViewTransition | undefined = React.ViewTransition;

export interface ProductCardProps {
  name: string;
  /** Garment type, e.g. "Oversized tee". */
  type?: string;
  /** The piece's Scripture, quoted in full under the name. Wall tiles leave it out. */
  quote?: { text: string; reference: string; translation: string; excerpt?: boolean };
  /** The whole garment, showing its main artwork. */
  image: string;
  imageAlt?: string;
  /** Shown on hover, usually the other side. */
  hoverImage?: string;
  href: string;
  price?: string;
  /** Said plainly under the price when it applies: "Sold out", "Not open for ordering yet". */
  status?: string;
  /** The piece's plate color (a CSS value), behind the image while it loads. */
  plate?: string;
  /**
   * Names the image for the morph into the product page, which gives its first image the same
   * name. Once per page: leave it off a second card for the same piece.
   */
  transitionName?: string;
  /**
   * When the image answers to that name. "always" (default) suits a page of tiles. "leaving"
   * names it only once its link is followed: for a product page, whose tiles would otherwise
   * pair with the next page's tiles and fade out one by one.
   */
  transitionWhen?: "always" | "leaving";
  /** Load the image eagerly (above the fold). */
  priority?: boolean;
  /** Heading level for the name; h3 under a section heading. */
  as?: "h2" | "h3";
  className?: string;
}

/**
 * A product tile: the whole garment, the name, its type and price, then (on shop cards) its
 * Scripture in italic with the reference. The name comes first: nothing sits above it as a
 * label. The whole card links to the product page.
 */
export function ProductCard({
  name,
  type,
  quote,
  image,
  imageAlt,
  hoverImage,
  href,
  price,
  status,
  plate,
  transitionName,
  transitionWhen = "always",
  priority,
  as: Heading = "h3",
  className,
}: ProductCardProps) {
  const [leaving, setLeaving] = useState(false);
  const named = transitionWhen === "always" || leaving;
  const listing = (
    <img
      src={image}
      alt={imageAlt ?? name}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
  return (
    <article className={cx("aw-card", className)}>
      <BrandLink href={href} className="aw-card-link" onClick={() => setLeaving(true)}>
        <div
          className="aw-card-media"
          style={plate ? ({ "--plate": plate } as CSSProperties) : undefined}
        >
          {Morph ? (
            <Morph name={named ? transitionName : undefined} share="piece" default="none">
              {listing}
            </Morph>
          ) : (
            listing
          )}
          {hoverImage ? (
            <img
              className="aw-card-alt"
              src={hoverImage}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>
        <div className="aw-card-meta">
          <Heading className="aw-card-name">{name}</Heading>
          {type || price ? (
            <p className="aw-card-facts">
              {type ? <span>{type}</span> : null}
              {price ? <span className="aw-card-price">{price}</span> : null}
            </p>
          ) : null}
          {status ? <p className="aw-card-status">{status}</p> : null}
          {quote ? (
            <ScriptureQuote
              text={quote.text}
              reference={quote.reference}
              translation={quote.translation}
              excerpt={quote.excerpt}
              size="sm"
            />
          ) : null}
        </div>
      </BrandLink>
    </article>
  );
}
