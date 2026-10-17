import { Button } from "@awebound/brand";
import type { Welcome } from "./offer";

/**
 * The welcome at the top of the overview, always shown (the owner's choice, October 2026), on bone
 * paper so it stands apart from Idea Submissions below it: a sentence, what Your collection keeps
 * for each design bought, and one next step. It sits in the page, never a popup.
 */
export function ArchiveWelcome({ title, body, lead, holds, action, more }: Welcome) {
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
        <p className="aw-body archive-welcome-lead">{lead}</p>
        <ul className="collection-holds aw-body">
          {holds.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
      <div className="archive-welcome-actions">
        <Button variant="secondary" href={action.href}>
          {action.label}
        </Button>
        {more ? (
          <Button variant="link" href={more.href}>
            {more.label}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
