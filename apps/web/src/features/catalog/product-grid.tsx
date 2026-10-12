"use client";

import type { ProductList, ProductQueryInput } from "@/shared";
import { useState } from "react";
import { loadMoreProducts } from "@/server/actions";
import { useCatalogState } from "./catalog-state";
import { ReleaseCard } from "@/features/release/release-card";

interface ProductGridProps {
  initial: ProductList;
  /** The query that produced `initial`, used to fetch further pages. */
  query: ProductQueryInput;
  queryKey: string;
}

/**
 * The results grid. Each card's image carries its piece's name for view transitions, so a filter
 * or sort change moves the cards that stay to their new places; "Show more" appends the next page.
 */
export function ProductGrid({ initial, query, queryKey }: ProductGridProps) {
  const { isPending } = useCatalogState();
  const [items, setItems] = useState(initial.items);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // New filters: start over from the server's first page (adjusting state during render).
  const [lastKey, setLastKey] = useState(queryKey);
  if (queryKey !== lastKey) {
    setLastKey(queryKey);
    setItems(initial.items);
    setPage(1);
    setHasMore(initial.hasMore);
    setError(false);
  }

  async function more() {
    setLoading(true);
    setError(false);
    const result = await loadMoreProducts({ ...query, page: page + 1 }).catch(() => null);
    if (result?.ok) {
      const next = result.data;
      setItems((current) => [
        ...current,
        ...next.items.filter((n) => !current.some((c) => c.slug === n.slug)),
      ]);
      setPage(next.page);
      setHasMore(next.hasMore);
    } else {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <div className="shop-grid" data-pending={isPending} aria-busy={isPending}>
      <ul className="product-grid">
        {items.map((p, i) => (
          <li key={p.slug}>
            <ReleaseCard product={p} priority={i < 3} />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className="shop-more">
          <p className="aw-small">
            Showing {items.length} of {initial.total}
          </p>
          <button
            type="button"
            className="aw-btn aw-btn-secondary"
            onClick={more}
            disabled={loading}
          >
            {loading ? "Loading…" : "Show more"}
          </button>
          {error ? (
            <p className="aw-form-error" role="alert">
              More pieces didn’t load. Try again.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
