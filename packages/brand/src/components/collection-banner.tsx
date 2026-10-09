"use client";

import type { ReactNode } from "react";
import { cx } from "../cx";
import { Button } from "./button";
import type { Action } from "./hero";

export interface CollectionBannerProps {
  family: string;
  pillar: string;
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

/** A collection intro: pillar label, family name, one line of story and one action. */
export function CollectionBanner({
  family,
  pillar,
  story,
  tone = "coal",
  action,
  as: Heading = "h2",
  children,
  className,
}: CollectionBannerProps) {
  return (
    <section
      className={cx("aw-banner", tone === "feature" ? "aw-banner-feature" : "aw-banner-coal", "aw-grain", className)}
    >
      <div className="aw-banner-in">
        <p className="aw-label">{pillar}</p>
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
