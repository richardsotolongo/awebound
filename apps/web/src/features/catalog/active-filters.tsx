"use client";

import { SORT_LABELS, type Sort } from "@/shared";
import { CloseIcon } from "@/components/icons";
import { useCatalogState } from "./catalog-state";

interface Chip {
  label: string;
  remove: () => void;
}

/**
 * Result count and removable chips for search and the sheet's filters. Collection and category
 * show as the active state of their selectors instead.
 */
export function ActiveFilters({ total }: { total: number }) {
  const state = useCatalogState();
  const chips: Chip[] = [];
  const q = state.get("q");
  if (q) chips.push({ label: `“${q}”`, remove: () => state.update({ q: null }) });
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
        <button
          type="button"
          className="aw-btn aw-btn-link"
          onClick={() =>
            state.update({ q: null, color: null, size: null, minPrice: null, maxPrice: null })
          }
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
