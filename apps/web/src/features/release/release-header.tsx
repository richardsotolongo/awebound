import { ScriptureRef } from "@awebound/brand";
import Link from "next/link";
import { RELEASE, VISIONS } from "@/lib/release";

/** The shop's title block: the release name, its call, and the six pieces as a numbered index. */
export function ReleaseHeader() {
  return (
    <header className="shop-release">
      <div className="shop-release-text">
        <p className="aw-label">
          Release {RELEASE.number} · {RELEASE.pieces} pieces
        </p>
        <h1 className="shop-release-name">{RELEASE.name}</h1>
        <p className="aw-body">{RELEASE.tagline}</p>
        <ScriptureRef reference={RELEASE.reference} align="start" />
      </div>
      <nav aria-label="Pieces in this release">
        <ol className="shop-release-index">
          {VISIONS.map((v) => (
            <li key={v.slug}>
              <Link href={`/shop/${v.slug}`}>
                <span className="shop-release-num">{v.numeral}</span>
                <span className="shop-release-theme">{v.theme}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  );
}
