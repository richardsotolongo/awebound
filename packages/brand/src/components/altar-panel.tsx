"use client";

import type { ReactNode } from "react";
import { cx } from "../cx";
import { Button } from "./button";
import type { Action } from "./hero";
import { ThornCross, Wordmark } from "./marks";
import { ScriptureRef } from "./scripture-ref";

export interface AltarPanelProps {
  /** The signature oxblood wordmark (default) or the Thorn Cross. */
  mark?: "wordmark" | "cross" | "none";
  eyebrow?: string;
  title?: string;
  /** Heading level for the title; "h1" when the panel opens the page. */
  as?: "h1" | "h2";
  body?: string;
  scripture?: string;
  action?: Action;
  children?: ReactNode;
  id?: string;
  className?: string;
}

/**
 * A warm-bone panel that breaks the dark page and carries the signature lockup. One or two per
 * page. As the page's opening (`as="h1"`) the wordmark and the title take their full size.
 */
export function AltarPanel({
  mark = "wordmark",
  eyebrow,
  title,
  as: Heading = "h2",
  body,
  scripture,
  action,
  children,
  id,
  className,
}: AltarPanelProps) {
  return (
    <section
      id={id}
      className={cx("aw-altar", className)}
      data-opening={Heading === "h1" ? true : undefined}
    >
      <div className="aw-altar-in">
        {mark === "cross" ? <ThornCross height={120} className="aw-altar-mark" /> : null}
        {mark === "wordmark" ? <Wordmark height={88} className="aw-altar-mark" /> : null}
        {eyebrow ? <p className="aw-label">{eyebrow}</p> : null}
        {title ? <Heading className={Heading === "h1" ? "aw-h1" : "aw-h2"}>{title}</Heading> : null}
        {body ? <p className="aw-altar-body">{body}</p> : null}
        {scripture ? <ScriptureRef reference={scripture} /> : null}
        {children}
        {action ? (
          <Button variant="on-altar" href={action.href}>
            {action.label}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
