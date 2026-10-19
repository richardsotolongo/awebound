import { Button, ThornCross } from "@awebound/brand";
import type { Welcome } from "./offer";

/**
 * The welcome on an empty collection, on bone paper: what each design bought opens, why it is
 * empty, one next step, the Founding Member note while places are left, and where saved pieces
 * go. It sits in the page, never a popup.
 */
export function ArchiveWelcome({
  title,
  lead,
  holds,
  why,
  saved,
  founding,
  explore,
  claims,
}: Welcome & { explore: { href: string; label: string }; claims: boolean }) {
  return (
    <section className="archive-welcome" aria-labelledby="welcome-title">
      <div className="archive-welcome-words">
        <h2 id="welcome-title" className="aw-h3">
          {title}
        </h2>
        <p className="aw-body archive-welcome-lead">{lead}</p>
        <ul className="collection-holds aw-body">
          {holds.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <p className="aw-small">{why}</p>
      </div>
      <div className="archive-welcome-actions">
        <Button variant="secondary" href={explore.href}>
          {explore.label}
        </Button>
        {claims ? (
          <Button variant="link" href="/account/orders/link">
            Link a past order
          </Button>
        ) : null}
      </div>
      {founding ? (
        <div className="archive-welcome-founding">
          <span className="archive-welcome-founding-mark">
            <ThornCross size="small" height={36} title="" />
          </span>
          <div>
            <p className="archive-welcome-founding-title">{founding.title}</p>
            <p className="aw-small">{founding.body}</p>
          </div>
        </div>
      ) : null}
      <p className="aw-small archive-welcome-saved">{saved}</p>
    </section>
  );
}
