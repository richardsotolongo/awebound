import { ScriptureRef } from "@awebound/brand";
import { releaseStatusText } from "@/features/release/release-status";
import type { CollectionView } from "./catalog-view";

/**
 * The shop's title block for the collection on screen: its release number, name and call, and
 * whether it can be ordered yet. All Collections gets a plain title.
 */
export function ShopHeader({ view }: { view: CollectionView }) {
  const { release, latest } = view;
  if (!release) {
    return (
      <header className="shop-head soft-glow">
        <p className="aw-label">All collections</p>
        <h1 className="aw-h1">The shop</h1>
        <p className="aw-body">Every Awebound piece, across every release.</p>
      </header>
    );
  }
  const isLatest = latest?.slug === release.slug;
  const status = releaseStatusText(release);
  return (
    <header className="shop-head soft-glow">
      <p className="aw-label">
        {isLatest ? "Latest drop · " : ""}Release {release.number}
      </p>
      <h1 className="shop-head-name">{release.name}</h1>
      <p className="aw-body">{release.tagline}</p>
      <div className="shop-head-meta">
        <ScriptureRef reference={release.scriptureRef} align="start" />
        {status ? <p className="aw-small">{status}</p> : null}
      </div>
    </header>
  );
}
