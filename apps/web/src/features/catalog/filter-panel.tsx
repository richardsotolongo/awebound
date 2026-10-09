"use client";

import { colorCss, type CatalogFacets } from "@/shared";
import { useId, useState } from "react";
import { useCatalogState } from "./catalog-state";

interface FilterPanelProps {
  facets: CatalogFacets;
}

/**
 * Color, size and price filters. Collection and category have their own selectors above the
 * grid. Counts reflect the other active filters.
 */
export function FilterPanel({ facets }: FilterPanelProps) {
  const state = useCatalogState();
  const colors = state.getList("color");
  const sizes = state.getList("size");

  return (
    <div className="filters">
      {facets.colors.length > 0 ? (
        <fieldset className="filter-group">
          <legend className="aw-label">Color{colors.length ? ` · ${colors.length}` : ""}</legend>
          <div className="filter-swatches">
            {facets.colors.map((c) => {
              const on = colors.includes(c.name);
              return (
                <button
                  key={c.name}
                  type="button"
                  className="filter-swatch"
                  aria-pressed={on}
                  aria-label={`${c.name}, ${c.count} pieces`}
                  title={`${c.name} (${c.count})`}
                  disabled={c.count === 0 && !on}
                  onClick={() => state.toggle("color", c.name)}
                >
                  <i style={{ background: colorCss(c) }} />
                </button>
              );
            })}
          </div>
          {colors.length ? <p className="field-help">{colors.join(", ")}</p> : null}
        </fieldset>
      ) : null}

      {facets.sizes.length > 0 ? (
        <fieldset className="filter-group">
          <legend className="aw-label">Size in stock</legend>
          <div className="filter-sizes">
            {facets.sizes.map((s) => {
              const on = sizes.includes(s.size);
              return (
                <button
                  key={s.size}
                  type="button"
                  className="aw-size"
                  aria-pressed={on}
                  aria-label={`${s.size}, ${s.count} pieces`}
                  disabled={s.count === 0 && !on}
                  onClick={() => state.toggle("size", s.size)}
                  style={s.count === 0 && !on ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                >
                  {s.size}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {facets.price.max > 0 ? <PriceFilter min={facets.price.min} max={facets.price.max} /> : null}
    </div>
  );
}

function PriceFilter({ min, max }: { min: number; max: number }) {
  const state = useCatalogState();
  const id = useId();
  const urlMin = state.get("minPrice") ?? "";
  const urlMax = state.get("maxPrice") ?? "";
  const [lo, setLo] = useState(urlMin);
  const [hi, setHi] = useState(urlMax);

  const [lastUrl, setLastUrl] = useState(`${urlMin}|${urlMax}`);
  if (`${urlMin}|${urlMax}` !== lastUrl) {
    setLastUrl(`${urlMin}|${urlMax}`);
    setLo(urlMin);
    setHi(urlMax);
  }

  function apply() {
    const clean = (v: string) =>
      v.trim() === "" ? null : String(Math.max(0, Math.round(Number(v))));
    if (clean(lo) === (urlMin || null) && clean(hi) === (urlMax || null)) return;
    state.update({ minPrice: clean(lo), maxPrice: clean(hi) });
  }

  return (
    <fieldset className="filter-group">
      <legend className="aw-label">Price (USD)</legend>
      <form
        className="price-range"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <label htmlFor={`${id}-min`} className="visually-hidden">
          Minimum price
        </label>
        <input
          id={`${id}-min`}
          className="aw-input"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={`$${min}`}
          value={lo}
          onChange={(e) => setLo(e.target.value)}
          onBlur={apply}
        />
        <span className="aw-small" aria-hidden="true">
          to
        </span>
        <label htmlFor={`${id}-max`} className="visually-hidden">
          Maximum price
        </label>
        <input
          id={`${id}-max`}
          className="aw-input"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={`$${max}`}
          value={hi}
          onChange={(e) => setHi(e.target.value)}
          onBlur={apply}
        />
        <button type="submit" className="visually-hidden">
          Apply price
        </button>
      </form>
    </fieldset>
  );
}
