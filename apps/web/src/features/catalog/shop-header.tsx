import { ScriptureRef } from "@awebound/brand";
import { FitName } from "@/components/fit-name";
import { ALL_COLLECTIONS } from "@/shared";
import type { CollectionView } from "./catalog-view";

/**
 * The shop's title block: the chosen release's name across the width and its call. On All
 * Collections (the default) it promotes the latest drop the same way; without releases, a plain
 * title.
 */
export function ShopHeader({ view }: { view: CollectionView }) {
  const release = view.release ?? (view.choice === ALL_COLLECTIONS ? view.latest : null);
  if (!release) {
    return (
      <header className="release-head shop-head">
        <h1 className="aw-h1">The shop</h1>
        <p className="release-tagline">Every Awebound piece, across every release.</p>
      </header>
    );
  }
  return (
    <header className="release-head shop-head">
      <FitName as="h1">{release.name}</FitName>
      <div className="release-sub">
        <p className="release-tagline">{release.tagline}</p>
        <ScriptureRef reference={release.scriptureRef} align="start" />
      </div>
    </header>
  );
}
