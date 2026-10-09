import { ScriptureRef } from "@awebound/brand";
import type { CollectionView } from "./catalog-view";

/**
 * The shop's title block for the collection on screen: its release number, name and call, and
 * whether it can be ordered yet. All Collections gets a plain title.
 */
export function ShopHeader({ view }: { view: CollectionView }) {
  const { release, latest } = view;
  if (!release) {
    return (
      <header className="shop-head">
        <p className="aw-label">All collections</p>
        <h1 className="aw-h1">The shop</h1>
        <p className="aw-body">Every Awebound piece, across every release.</p>
      </header>
    );
  }
  const isLatest = latest?.slug === release.slug;
  return (
    <header className="shop-head">
      <p className="aw-label">
        {isLatest ? "Latest drop · " : ""}Release {release.number}
      </p>
      <h1 className="shop-head-name">{release.name}</h1>
      <p className="aw-body">{release.tagline}</p>
      <div className="shop-head-meta">
        <ScriptureRef reference={release.scriptureRef} align="start" />
        {release.status === "preview" ? (
          <p className="release-status">
            <span className="release-status-dot" aria-hidden="true" />
            Coming soon: ordering isn’t open yet
          </p>
        ) : null}
      </div>
    </header>
  );
}
