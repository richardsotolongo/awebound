import type { OwnerIdea } from "@/server/archive/ideas";
import { when } from "./format";
import { IdeaReview } from "./idea-review";

const PARTS = [
  ["Their idea", "idea"],
  ["The verse", "verse"],
  ["The biblical context", "context"],
] as const;

/** One submission in Owner → Ideas: the image (a one-hour signed link) beside who sent it, their words and the review. */
export function IdeaCard({ idea: s }: { idea: OwnerIdea }) {
  return (
    <article className="admin-idea" data-status={s.status}>
      <div className="admin-idea-image">
        {s.imageUrl ? (
          <a href={s.imageUrl} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- a one-hour signed URL to a private upload */}
            <img src={s.imageUrl} alt={`Design submitted by ${s.name ?? s.email}`} />
          </a>
        ) : (
          <div className="admin-idea-noimage">No image</div>
        )}
        {s.imageUrl ? (
          <p className="aw-small">
            {s.image_mime === "image/png" ? "PNG" : "JPEG"}, {s.image_width} x {s.image_height}.{" "}
            <a href={s.imageUrl} target="_blank" rel="noreferrer">
              Full size
            </a>
          </p>
        ) : null}
      </div>
      <div className="admin-idea-body">
        <header className="admin-idea-head">
          <h2 className="aw-h3">{s.name ?? s.email}</h2>
          <p className="admin-idea-meta">
            <a href={`mailto:${s.email}?subject=${encodeURIComponent("Your Awebound idea")}`}>
              {s.email}
            </a>
            <span>Sent {when(s.created_at)}</span>
            <span>
              {s.purchases_at_submit === null
                ? "Owner test"
                : `${s.purchases_at_submit} purchases when sent, ${s.purchasesNow} now`}
            </span>
            <span>{s.emailed_at ? "Emailed" : "Not emailed"}</span>
          </p>
        </header>
        {PARTS.map(([title, key]) =>
          s[key] ? (
            <div key={key} className="admin-idea-part">
              <h3>{title}</h3>
              <p>{s[key]}</p>
            </div>
          ) : null,
        )}
        <IdeaReview id={s.id} status={s.status} note={s.owner_note} />
        {s.reviewed_at ? <p className="aw-small">Last reviewed {when(s.reviewed_at)}</p> : null}
      </div>
    </article>
  );
}
