"use client";

import { cx } from "../cx";
import { BrandLink } from "../link";
import { ScriptureQuote } from "./scripture-quote";

export interface ProductCardProps {
  name: string;
  /** Garment type, e.g. "Oversized tee". */
  type?: string;
  /** The piece's Scripture, quoted in full under the name. */
  quote?: { text: string; reference: string; translation: string; excerpt?: boolean };
  /** The whole garment, showing its main artwork. */
  image: string;
  imageAlt?: string;
  /** Shown on hover, usually the other side. */
  hoverImage?: string;
  href: string;
  price?: string;
  /** Load the image eagerly (above the fold). */
  priority?: boolean;
  /** Heading level for the name; h3 under a section heading. */
  as?: "h2" | "h3";
  className?: string;
}

/**
 * A product tile: the whole garment, its type and price, the name, then its Scripture in italic
 * with the reference. The whole card links to the product page.
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
  priority,
  as: Heading = "h3",
  className,
}: ProductCardProps) {
  return (
    <article className={cx("aw-card", className)}>
      <BrandLink href={href} className="aw-card-link">
        <div className="aw-card-media">
          <img
            src={image}
            alt={imageAlt ?? name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
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
          <p className="aw-card-top">
            {type ? <span>{type}</span> : null}
            {price ? <span className="aw-card-price">{price}</span> : null}
          </p>
          <Heading className="aw-card-name">{name}</Heading>
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
