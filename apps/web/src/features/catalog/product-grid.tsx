"use client";

import { ProductCard } from "@awebound/brand";
import type { ProductList, ProductQueryInput } from "@awebound/shared";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { api } from "@/lib/api";
import { useCatalogState } from "./catalog-state";
import { toCardProps } from "./query";

interface ProductGridProps {
  initial: ProductList;
  /** The query that produced `initial`, used to fetch further pages. */
  query: ProductQueryInput;
  queryKey: string;
  wide?: boolean;
}

/** The results grid. Cards animate in and out as filters change; "Show more" appends the next page. */
export function ProductGrid({ initial, query, queryKey, wide }: ProductGridProps) {
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
    try {
      const next = await api.listProducts({ ...query, page: page + 1 });
      setItems((current) => [
        ...current,
        ...next.items.filter((n) => !current.some((c) => c.slug === n.slug)),
      ]);
      setPage(next.page);
      setHasMore(next.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shop-grid" data-pending={isPending} aria-busy={isPending}>
      <motion.ul
        className="product-grid"
        data-wide={wide}
        style={{ listStyle: "none", margin: 0, padding: 0 }}
        layout
      >
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((p, i) => (
            <motion.li
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <ProductCard {...toCardProps(p, i < 3)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
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
