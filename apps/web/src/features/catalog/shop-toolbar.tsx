"use client";

import { SORT_LABELS, SORT_OPTIONS, type CatalogFacets } from "@/shared";
import { useId, useRef, useState } from "react";
import { CloseIcon, FilterIcon, SearchIcon } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { useCatalogState } from "./catalog-state";
import { FilterPanel } from "./filter-panel";

interface ShopToolbarProps {
  facets: CatalogFacets;
  total: number;
}

/** Search, sort, and the sheet with color, size and price filters. */
export function ShopToolbar({ facets, total }: ShopToolbarProps) {
  const state = useCatalogState();
  const searchId = useId();
  const sortId = useId();
  const urlQ = state.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const active =
    state.getList("color").length +
    state.getList("size").length +
    (state.get("minPrice") || state.get("maxPrice") ? 1 : 0);

  // Keep the box in step with Back/Forward.
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    // Don't fight the person typing: only replace the text when it really changed (Back, chips, clear).
    if (urlQ !== q.trim()) setQ(urlQ);
  }

  function onSearch(value: string) {
    setQ(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => state.update({ q: value.trim() || null }), 300);
  }

  return (
    <div className="shop-toolbar">
      <form
        role="search"
        className="shop-search"
        onSubmit={(e) => {
          e.preventDefault();
          clearTimeout(timer.current);
          state.update({ q: q.trim() || null });
        }}
      >
        <label htmlFor={searchId} className="visually-hidden">
          Search the shop
        </label>
        <SearchIcon />
        <input
          id={searchId}
          className="aw-input"
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Search names, verses, colors"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
        />
        {q ? (
          <button
            type="button"
            className="icon-btn"
            aria-label="Clear search"
            onClick={() => onSearch("")}
          >
            <CloseIcon size={16} />
          </button>
        ) : null}
      </form>

      <div>
        <label htmlFor={sortId} className="visually-hidden">
          Sort by
        </label>
        <select
          id={sortId}
          className="aw-select"
          value={state.get("sort") ?? "featured"}
          onChange={(e) =>
            state.update({ sort: e.target.value === "featured" ? null : e.target.value })
          }
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="aw-btn aw-btn-secondary shop-filter-btn"
        onClick={() => setFiltersOpen(true)}
        aria-controls="filters"
        aria-expanded={filtersOpen}
      >
        <FilterIcon size={16} /> Filters{active ? ` (${active})` : ""}
      </button>

      <Sheet
        id="filters"
        side="left"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <div className="aw-btn-row" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="aw-btn aw-btn-link"
              onClick={() =>
                state.update({ color: null, size: null, minPrice: null, maxPrice: null })
              }
            >
              Clear filters
            </button>
            <button
              type="button"
              className="aw-btn aw-btn-secondary"
              onClick={() => setFiltersOpen(false)}
            >
              Show {total} {total === 1 ? "piece" : "pieces"}
            </button>
          </div>
        }
      >
        <FilterPanel facets={facets} />
      </Sheet>
    </div>
  );
}
