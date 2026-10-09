"use client";

import { cx } from "../cx";
import { Button } from "./button";
import { ScriptureRef } from "./scripture-ref";

export interface Action {
  label: string;
  href: string;
}

export interface HeroProps {
  eyebrow?: string;
  /** Twelve words at most. */
  title: string;
  /** One sentence. */
  body?: string;
  primary?: Action;
  secondary?: Action;
  scripture?: string;
  image?: string;
  imageAlt?: string;
  className?: string;
}

/** The page opener. Carries the page's only oxblood glow. One hero per page. */
export function Hero({
  eyebrow,
  title,
  body,
  primary,
  secondary,
  scripture,
  image,
  imageAlt,
  className,
}: HeroProps) {
  return (
    <section className={cx("aw-hero", "aw-grain", image && "aw-hero-split", className)}>
      <div className="aw-hero-text">
        {eyebrow ? <p className="aw-label">{eyebrow}</p> : null}
        <h1 className="aw-display">{title}</h1>
        {body ? <p className="aw-hero-body">{body}</p> : null}
        {primary || secondary ? (
          <div className="aw-btn-row">
            {primary ? (
              <Button variant="primary" href={primary.href}>
                {primary.label}
              </Button>
            ) : null}
            {secondary ? (
              <Button variant="secondary" href={secondary.href}>
                {secondary.label}
              </Button>
            ) : null}
          </div>
        ) : null}
        {scripture ? <ScriptureRef reference={scripture} align="start" /> : null}
      </div>
      {image ? (
        <div className="aw-hero-media">
          <img src={image} alt={imageAlt ?? ""} />
        </div>
      ) : null}
    </section>
  );
}
