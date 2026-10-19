import { ThornCross } from "@awebound/brand";
import { FOUNDING_PERKS } from "./offer";

const WALLPAPERS = [
  { theme: "bone", label: "Bone", note: "Oxblood on warm bone" },
  { theme: "coal", label: "Coal", note: "Bone on coal" },
] as const;

/**
 * The Founding tab's content: the seal and the member's place (shown to them alone), what it
 * includes, and their numbered wallpapers in both colorways. `sample` marks the owner's view.
 */
export function FoundingView({ rank, sample }: { rank: number; sample: boolean }) {
  return (
    <>
      {sample ? (
        <p className="notice aw-small founding-owner-note">
          You’re seeing this as the owner, with a sample place. Founding Members see their own.
        </p>
      ) : null}

      <section className="founding-seal" aria-labelledby="founding-title">
        <span className="founding-seal-mark">
          <ThornCross height={88} title="" />
        </span>
        <div className="founding-seal-words">
          <h2 id="founding-title" className="founding-seal-title">
            Founding Member
          </h2>
          <p className="founding-seal-place">No. {rank} of 50</p>
          <p className="aw-body">
            You were one of the first 50 people to buy from Awebound with your account. Thank you
            for being here from the beginning.
          </p>
        </div>
      </section>

      <section className="founding-section" aria-labelledby="founding-includes">
        <h2 id="founding-includes" className="aw-h3">
          What it includes
        </h2>
        <ul className="founding-perks aw-body">
          {FOUNDING_PERKS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="founding-section" aria-labelledby="founding-wallpapers">
        <h2 id="founding-wallpapers" className="aw-h3">
          Your wallpapers
        </h2>
        <p className="aw-body">Numbered for you, in two colorways.</p>
        <div className="founding-walls">
          {WALLPAPERS.map((w) => (
            <div key={w.theme} className="founding-wall" data-theme-name={w.theme}>
              <div className="founding-wall-preview" aria-hidden="true">
                <ThornCross height={56} title="" />
                <span className="founding-wall-name">Founding Member</span>
                <span className="founding-wall-no">No. {rank} of 50</span>
              </div>
              <p className="aw-label">{w.label}</p>
              <p className="aw-small">{w.note}</p>
              <div className="founding-wall-links">
                <a
                  className="aw-btn aw-btn-secondary"
                  href={`/api/archive/founding/wallpaper?theme=${w.theme}&device=phone`}
                  download
                >
                  Phone
                </a>
                <a
                  className="aw-btn aw-btn-secondary"
                  href={`/api/archive/founding/wallpaper?theme=${w.theme}&device=desktop`}
                  download
                >
                  Desktop
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
