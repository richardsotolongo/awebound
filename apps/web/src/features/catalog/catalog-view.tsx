import { Button } from "@awebound/brand";
import { ALL_COLLECTIONS, LATEST_DROP, toSearchParams, type Release } from "@/shared";
import Link from "next/link";
import { getFacets, getReleases, searchProducts } from "@/server/catalog";
import { ActiveFilters } from "./active-filters";
import { CatalogStateProvider } from "./catalog-state";
import { ProductGrid } from "./product-grid";
import {
  EMPTY_FACETS,
  EMPTY_LIST,
  collectionChoice,
  parseCatalogQuery,
  shopHref,
  toApiQuery,
  type RawSearchParams,
} from "./query";
import { ShopToolbar } from "./shop-toolbar";

interface CatalogViewProps {
  searchParams: RawSearchParams;
  /** Path the filters navigate within, e.g. /shop. */
  basePath: string;
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

/** What the collection selector is showing, resolved against the releases that exist. */
export interface CollectionView {
  choice: string;
  /** The release on screen; null for All Collections or an unknown slug. */
  release: Release | null;
  latest: Release | null;
  releases: Release[];
}

export async function resolveCollection(searchParams: RawSearchParams): Promise<CollectionView> {
  const releases = (await read(getReleases, [])).data;
  const latest = releases[0] ?? null;
  const choice = collectionChoice(searchParams);
  const release =
    choice === LATEST_DROP
      ? latest
      : choice === ALL_COLLECTIONS
        ? null
        : (releases.find((r) => r.slug === choice) ?? null);
  return { choice, release, latest, releases };
}

/**
 * The shop: a collection selector (Latest Drop, All Collections, then each release by name) and
 * category tabs that combine with it, search, sort, a filter sheet, chips and the grid. Every
 * choice is a link, so filtered views are shareable and Back works.
 */
export async function CatalogView({
  searchParams,
  basePath,
  view,
}: CatalogViewProps & { view: CollectionView }) {
  const query = parseCatalogQuery(searchParams);
  const { choice, release, latest, releases } = view;
  const unknown = choice !== LATEST_DROP && choice !== ALL_COLLECTIONS && !release;
  // An unknown collection matches nothing, which shows the empty state with a reset.
  query.collection = release ? [release.slug] : unknown ? [choice] : undefined;

  const apiQuery = toApiQuery(query);
  const [list, facets, everything] = await Promise.all([
    read(() => searchProducts(apiQuery), EMPTY_LIST),
    read(() => getFacets(apiQuery), EMPTY_FACETS),
    read(() => getFacets({}), EMPTY_FACETS),
  ]);
  const queryKey = toSearchParams(apiQuery).toString();
  const activeCategory = query.category?.length === 1 ? query.category[0] : undefined;

  // Collection counts honour the chosen category and other filters; category counts honour the
  // chosen collection. Categories with no pieces anywhere aren't offered.
  const collectionCount = (slug: string) =>
    facets.data.collections.find((c) => c.slug === slug)?.count ?? 0;
  const allCount = facets.data.collections.reduce((n, c) => n + c.count, 0);
  const categories = facets.data.categories.filter(
    (c) =>
      activeCategory === c.slug ||
      (everything.data.categories.find((e) => e.slug === c.slug)?.count ?? 0) > 0,
  );
  const categoryTotal = facets.data.categories.reduce((n, c) => n + c.count, 0);

  const collectionLabel =
    choice === ALL_COLLECTIONS ? "any collection" : (release?.name ?? "this collection");
  const categoryName = categories.find((c) => c.slug === activeCategory)?.name;
  const filtered =
    Boolean(query.q) ||
    Boolean(query.color?.length) ||
    Boolean(query.size?.length) ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined;

  return (
    <CatalogStateProvider>
      <div className="shop-nav">
        <nav className="shop-collections" aria-label="Collections">
          <span className="aw-label shop-nav-label" aria-hidden="true">
            Collection
          </span>
          <Link
            href={shopHref(basePath, searchParams, { collection: null })}
            aria-current={choice === LATEST_DROP ? "page" : undefined}
            title={latest ? `Currently ${latest.name}` : undefined}
          >
            Latest Drop <span className="count">{latest ? collectionCount(latest.slug) : 0}</span>
          </Link>
          <Link
            href={shopHref(basePath, searchParams, { collection: ALL_COLLECTIONS })}
            aria-current={choice === ALL_COLLECTIONS ? "page" : undefined}
          >
            All Collections <span className="count">{allCount}</span>
          </Link>
          {releases.map((r) => (
            <Link
              key={r.slug}
              href={shopHref(basePath, searchParams, { collection: r.slug })}
              aria-current={choice === r.slug ? "page" : undefined}
            >
              {r.name} <span className="count">{collectionCount(r.slug)}</span>
            </Link>
          ))}
        </nav>

        <nav className="shop-tabs" aria-label="Categories">
          <span className="aw-label shop-nav-label" aria-hidden="true">
            Category
          </span>
          <Link
            href={shopHref(basePath, searchParams, { category: null })}
            aria-current={!activeCategory ? "page" : undefined}
          >
            All Products <span className="count">{categoryTotal}</span>
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={shopHref(basePath, searchParams, { category: c.slug })}
              aria-current={activeCategory === c.slug ? "page" : undefined}
              data-empty={c.count === 0}
            >
              {c.name} <span className="count">{c.count}</span>
            </Link>
          ))}
        </nav>
      </div>

      <ShopToolbar facets={facets.data} total={list.data.total} />
      <ActiveFilters total={list.data.total} />

      {list.failed ? (
        <div className="shop-empty" role="status">
          <p className="aw-h3">The shop is resting</p>
          <p className="aw-body">We couldn’t load the pieces just now. Try again in a moment.</p>
        </div>
      ) : list.data.items.length === 0 ? (
        <div className="shop-empty" role="status">
          <p className="aw-h3">
            {unknown
              ? "That collection isn’t on the site"
              : filtered
                ? "Nothing matches those filters"
                : `No ${categoryName?.toLowerCase() ?? "pieces"} in ${collectionLabel} yet`}
          </p>
          <p className="aw-body">
            {unknown
              ? "It may have been renamed. Every release is listed under Collections."
              : "Try another category or collection, or start again from the latest drop."}
          </p>
          <div className="aw-btn-row">
            <Button variant="secondary" href={basePath}>
              Reset filters
            </Button>
            {choice !== ALL_COLLECTIONS ? (
              <Button variant="link" href={shopHref(basePath, {}, { collection: ALL_COLLECTIONS })}>
                See all collections
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <ProductGrid initial={list.data} query={apiQuery} queryKey={queryKey} />
      )}
    </CatalogStateProvider>
  );
}
