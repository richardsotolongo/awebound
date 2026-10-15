import { Button } from "@awebound/brand";
import { ALL_COLLECTIONS, LATEST_DROP, toSearchParams, type Release } from "@/shared";
import { getFacets, getReleases, searchProducts } from "@/server/catalog";
import { ActiveFilters } from "./active-filters";
import { CatalogStateProvider } from "./catalog-state";
import { ProductGrid } from "./product-grid";
import {
  EMPTY_FACETS,
  EMPTY_LIST,
  collectionChoice,
  parseCatalogQuery,
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
  /** The release chosen; null for All Collections (the default) or an unknown slug. */
  release: Release | null;
  /** The newest release, which the shop's header promotes on All Collections. */
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
 * The shop: a search box, then three compact selectors (collection, category, sort) and the filter
 * sheet, chips and the grid. All Collections is the default, newest release first; every choice is
 * in the URL, so filtered views are shareable.
 */
export async function CatalogView({
  searchParams,
  basePath,
  view,
}: CatalogViewProps & { view: CollectionView }) {
  const query = parseCatalogQuery(searchParams);
  const { choice, release, releases } = view;
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

  // Categories with no pieces anywhere aren't offered.
  const categories = facets.data.categories.filter(
    (c) =>
      activeCategory === c.slug ||
      (everything.data.categories.find((e) => e.slug === c.slug)?.count ?? 0) > 0,
  );

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
      <ShopToolbar
        facets={facets.data}
        total={list.data.total}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        category={activeCategory ?? ""}
        releases={releases.map((r) => ({ slug: r.slug, name: r.name }))}
        collection={choice === LATEST_DROP ? (view.latest?.slug ?? ALL_COLLECTIONS) : choice}
      />
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
              ? "It may have been renamed. Reset to see every piece."
              : "Try another category or collection, or start again from every piece."}
          </p>
          <div className="aw-btn-row">
            <Button variant="secondary" href={basePath}>
              See every piece
            </Button>
          </div>
        </div>
      ) : (
        <ProductGrid initial={list.data} query={apiQuery} queryKey={queryKey} />
      )}
    </CatalogStateProvider>
  );
}
