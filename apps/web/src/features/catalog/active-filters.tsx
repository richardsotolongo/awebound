"use client";

import { SORT_LABELS, type CatalogFacets, type Sort } from "@/shared";
import { CloseIcon } from "@/components/icons";
import { useCatalogState } from "./catalog-state";

interface Chip {
  label: string;
  remove: () => void;
}

/** Result count and removable chips for every active filter. */
export function ActiveFilters({
  total,
  facets,
  lockedCollection,
}: {
  total: number;
  facets: CatalogFacets;
  lockedCollection?: boolean;
}) {
  const state = useCatalogState();
  const chips: Chip[] = [];
  const q = state.get("q");
  if (q) chips.push({ label: `“${q}”`, remove: () => state.update({ q: null }) });
  for (const slug of state.getList("category")) {
    const name = facets.categories.find((c) => c.slug === slug)?.name ?? slug;
    chips.push({ label: name, remove: () => state.toggle("category", slug) });
  }
  if (!lockedCollection) {
    for (const slug of state.getList("collection")) {
      const name = facets.collections.find((c) => c.slug === slug)?.name ?? slug;
      chips.push({ label: name, remove: () => state.toggle("collection", slug) });
    }
  }
  for (const color of state.getList("color"))
    chips.push({ label: color, remove: () => state.toggle("color", color) });
  for (const size of state.getList("size"))
    chips.push({ label: `Size ${size}`, remove: () => state.toggle("size", size) });
  const lo = state.get("minPrice");
  const hi = state.get("maxPrice");
  if (lo || hi) {
    const label = lo && hi ? `$${lo}–$${hi}` : lo ? `From $${lo}` : `Up to $${hi}`;
    chips.push({ label, remove: () => state.update({ minPrice: null, maxPrice: null }) });
  }
  const sort = state.get("sort") as Sort | undefined;

  return (
    <div className="shop-status">
      <p className="aw-small" role="status" aria-live="polite">
        {total} {total === 1 ? "piece" : "pieces"}
        {sort && sort !== "featured" ? ` · ${SORT_LABELS[sort]}` : ""}
      </p>
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          className="chip"
          onClick={chip.remove}
          aria-label={`Remove filter: ${chip.label}`}
        >
          {chip.label}
          <CloseIcon size={14} />
        </button>
      ))}
      {chips.length > 1 ? (
        <button type="button" className="aw-btn aw-btn-link" onClick={state.clear}>
          Clear all
        </button>
      ) : null}
    </div>
  );
}
