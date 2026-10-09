"use client";

import { cx } from "../cx";
import { BrandLink } from "../link";
import { ScriptureRef } from "./scripture-ref";

export interface ProductCardProps {
  /** Lookbook ID, e.g. A3-B01. */
  id: string;
  name: string;
  /** Cut and base color, e.g. "Oversized tee · Faded black". */
  base?: string;
  /** CSS colors, ideally var(--garment-*) tokens. */
  swatches?: string[];
  scripture?: string;
  /** Back view first. */
  image: string;
  imageAlt?: string;
  /** Shown on hover, usually the front view. */
  hoverImage?: string;
  href: string;
  price?: string;
  /** Load the image eagerly (above the fold). */
  priority?: boolean;
  className?: string;
}

/** A product tile: 4:5 back-print image, ID, Cinzel name, base color, color chips and the reference. */
export function ProductCard({
  id,
  name,
  base,
  swatches,
  scripture,
  image,
  imageAlt,
  hoverImage,
  href,
  price,
  priority,
  className,
}: ProductCardProps) {
  return (
    <article className={cx("aw-card", className)}>
      <BrandLink href={href} className="aw-card-link">
        <div className="aw-card-media">
          <img
            src={image}
            alt={imageAlt ?? `${name} back print`}
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
          <div className="aw-card-top">
            <span className="aw-meta">{id}</span>
            {price ? <span className="aw-meta">{price}</span> : null}
          </div>
          <h3 className="aw-card-name">{name}</h3>
          {base ? <p className="aw-small">{base}</p> : null}
          <div className="aw-card-foot">
            {swatches && swatches.length > 0 ? (
              <span className="aw-card-sw" aria-label={`${swatches.length} colors`}>
                {swatches.map((s) => (
                  <i key={s} style={{ background: s }} />
                ))}
              </span>
            ) : null}
            {scripture ? <ScriptureRef reference={scripture} align="start" /> : null}
          </div>
        </div>
      </BrandLink>
    </article>
  );
}
