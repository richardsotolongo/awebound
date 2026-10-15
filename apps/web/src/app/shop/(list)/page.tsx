import type { Metadata } from "next";
import { CatalogView, resolveCollection } from "@/features/catalog/catalog-view";
import {
  collectionChoice,
  parseCatalogQuery,
  shopCanonical,
  type RawSearchParams,
} from "@/features/catalog/query";
import { ShopHeader } from "@/features/catalog/shop-header";
import { pageMeta } from "@/lib/site";
import { getFacets, getReleases } from "@/server/catalog";
import { ALL_COLLECTIONS, LATEST_DROP } from "@/shared";

type Props = { searchParams: Promise<RawSearchParams> };

const SHOP = pageMeta({
  path: "/shop",
  title: "Shop",
  description:
    "Shop Awebound: Christian apparel rooted in Scripture. Browse the latest drop or every collection, by tees, oversized tees, hoodies and hats.",
});

/**
 * A release, a category, or both get their own listing in search; search, color, size, price and
 * sort point back to the view they filter. Every collection is the plain /shop, and an old Latest
 * Drop link is listed under the release's own name, so each set of pieces has one address. A view
 * with no pieces isn't indexed.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const choice = collectionChoice(params);
  const picked = parseCatalogQuery(params).category ?? [];
  if (choice === ALL_COLLECTIONS && picked.length !== 1) return SHOP;
  try {
    const releases = await getReleases();
    const all = choice === ALL_COLLECTIONS;
    const release = choice === LATEST_DROP ? releases[0] : releases.find((r) => r.slug === choice);
    const facets = await getFacets({ collection: release ? [release.slug] : undefined });
    const category =
      picked.length === 1
        ? facets.categories.find((c) => c.slug === picked[0] && c.count > 0)
        : undefined;
    // An unknown collection, or a category with no pieces in this view.
    if ((!all && !release) || (picked.length === 1 && !category)) {
      return { title: "Shop", robots: { index: false } };
    }

    const kind = category?.name.toLowerCase();
    return pageMeta({
      path: shopCanonical(all ? ALL_COLLECTIONS : release?.slug, category?.slug),
      title:
        [kind && `Christian ${kind}`, release?.name].filter(Boolean).join(" · ") ||
        "All collections",
      description: kind
        ? `Awebound ${kind}${release ? ` from ${release.name}` : ""}: Christian apparel, each piece drawn from a passage of Scripture.`
        : release
          ? `${release.name}, Release ${release.number}. ${release.tagline}`
          : "Every Awebound piece, across every release.",
    });
  } catch {
    // Fourthwall is unreachable: keep the plain listing instead of marking views empty.
    return SHOP;
  }
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = await resolveCollection(params);
  return (
    <div className="aw-container shop">
      <ShopHeader view={view} />
      <CatalogView searchParams={params} basePath="/shop" view={view} />
    </div>
  );
}
