"use client";

import type { ReactNode } from "react";
import { cx } from "../cx";
import { Button } from "./button";
import type { Action } from "./hero";

export interface CollectionBannerProps {
  /** The release or collection name. */
  family: string;
  /** Short label above the name, e.g. "Release 01". */
  eyebrow: string;
  /** One sentence. */
  story?: string;
  /** "feature" (washed oxblood) for a new drop. */
  tone?: "coal" | "feature";
  action?: Action;
  /** Heading level for the family name. */
  as?: "h1" | "h2";
  children?: ReactNode;
  className?: string;
}

/** A release intro: eyebrow label, name, one line of story and one action. */
export function CollectionBanner({
  family,
  eyebrow,
  story,
  tone = "coal",
  action,
  as: Heading = "h2",
  children,
  className,
}: CollectionBannerProps) {
  return (
    <section
      className={cx(
        "aw-banner",
        tone === "feature" ? "aw-banner-feature" : "aw-banner-coal",
        "aw-grain",
        className,
      )}
    >
      <div className="aw-banner-in">
        <p className="aw-label">{eyebrow}</p>
        <Heading className="aw-h2">{family}</Heading>
        {story ? <p className="aw-banner-story">{story}</p> : null}
        {children}
        {action ? (
          <Button variant={tone === "feature" ? "on-feature" : "secondary"} href={action.href}>
            {action.label}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
