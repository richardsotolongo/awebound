import { Button } from "@awebound/brand";
import { toSearchParams, type CollectionSlug } from "@/shared";
import Link from "next/link";
import { getFacets, searchProducts } from "@/server/catalog";
import { ActiveFilters } from "./active-filters";
import { CatalogStateProvider } from "./catalog-state";
import { ProductGrid } from "./product-grid";
import {
  EMPTY_FACETS,
  EMPTY_LIST,
  parseCatalogQuery,
  toApiQuery,
  type RawSearchParams,
} from "./query";
import { ShopToolbar } from "./shop-toolbar";

interface CatalogViewProps {
  searchParams: RawSearchParams;
  /** Path the filters navigate within, e.g. /shop. */
  basePath: string;
  /** Pins the listing to one release. */
  collection?: CollectionSlug;
}

async function read<T>(load: () => Promise<T>, fallback: T): Promise<{ data: T; failed: boolean }> {
  try {
    return { data: await load(), failed: false };
  } catch (error) {
    console.error(
      "[awebound] catalog read failed:",
      error instanceof Error ? error.message : error,
    );
    return { data: fallback, failed: true };
  }
}

/**
 * The shop: category tabs, search, sort, a filter sheet, chips and the numbered grid. A release
 * holds a handful of pieces, so filters live in a sheet instead of a sidebar and the grid gets
 * the full width.
 */
export async function CatalogView({ searchParams, basePath, collection }: CatalogViewProps) {
  const query = parseCatalogQuery(searchParams, { collection });
  const apiQuery = toApiQuery(query);
  const [list, facets] = await Promise.all([
    read(() => searchProducts(apiQuery), EMPTY_LIST),
    read(() => getFacets(apiQuery), EMPTY_FACETS),
  ]);
  const queryKey = toSearchParams(apiQuery).toString();
  const activeCategory = query.category?.length === 1 ? query.category[0] : undefined;

  const tabHref = (slug?: string) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === "category" || k === "page" || v === undefined) continue;
      params.set(k, Array.isArray(v) ? v.join(",") : v);
    }
    if (slug) params.set("category", slug);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const allCount = facets.data.categories.reduce((n, c) => n + c.count, 0);

  return (
    <CatalogStateProvider lockedKeys={collection ? ["collection"] : []}>
      <nav className="shop-tabs" aria-label="Categories">
        <Link href={tabHref()} aria-current={!activeCategory ? "page" : undefined} scroll={false}>
          All <span className="count">{allCount}</span>
        </Link>
        {facets.data.categories
          .filter((c) => c.count > 0 || activeCategory === c.slug)
          .map((c) => (
            <Link
              key={c.slug}
              href={tabHref(c.slug)}
              aria-current={activeCategory === c.slug ? "page" : undefined}
              scroll={false}
            >
              {c.name} <span className="count">{c.count}</span>
            </Link>
          ))}
      </nav>

      <div className="shop-layout">
        <div>
          <ShopToolbar
            facets={facets.data}
            hideCollections={Boolean(collection)}
            total={list.data.total}
          />
          <ActiveFilters
            total={list.data.total}
            facets={facets.data}
            lockedCollection={Boolean(collection)}
          />

          {list.failed ? (
            <div className="shop-empty" role="status">
              <p className="aw-h3">The shop is resting</p>
              <p className="aw-body">
                We couldn’t load the release just now. Try again in a moment.
              </p>
            </div>
          ) : list.data.items.length === 0 ? (
            <div className="shop-empty">
              <p className="aw-h3">Nothing matches that yet</p>
              <p className="aw-body">
                Try fewer filters, or search for a verse, a color or a design.
              </p>
              <Button variant="secondary" href={basePath}>
                Clear filters
              </Button>
            </div>
          ) : (
            <ProductGrid initial={list.data} query={apiQuery} queryKey={queryKey} />
          )}
        </div>
      </div>
    </CatalogStateProvider>
  );
}
