import { Button } from "@awebound/brand";
import type { Welcome } from "./offer";

/**
 * The welcome at the top of the overview, always shown (the owner's choice, October 2026). It sits
 * in the page, never a popup, with one next step.
 */
export function ArchiveWelcome({ title, body, action }: Welcome) {
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
      </div>
    </section>
  );
}
