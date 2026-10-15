"use client";

import { Button } from "@awebound/brand";
import { useState } from "react";
import { WELCOME_COOKIE, type Welcome } from "./offer";

/**
 * A short welcome at the top of the overview, shown until it is dismissed. It sits in the page
 * (never a popup) and dismissing it is remembered for a year in this browser.
 */
export function ArchiveWelcome({ kind, title, body, action }: Welcome) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  function dismiss() {
    document.cookie = `${WELCOME_COOKIE}=${kind}; Max-Age=31536000; Path=/account; SameSite=Lax`;
    setOpen(false);
    // The panel and its button are gone; keep the keyboard on the page.
    document.getElementById("archive-title")?.focus();
  }

  return (
    <section className="archive-welcome" aria-labelledby="welcome-title">
      <div className="archive-welcome-words">
        <h2 id="welcome-title" className="aw-h3">
          {title}
        </h2>
        {body.map((p) => (
          <p key={p} className="aw-body">
            {p}
          </p>
        ))}
      </div>
      <div className="archive-welcome-actions">
        <Button variant="secondary" href={action.href}>
          {action.label}
        </Button>
        <Button variant="link" onClick={dismiss}>
          Dismiss
        </Button>
      </div>
    </section>
  );
}
