import type { MetadataRoute } from "next";
import { EMPTY_FACETS, EMPTY_LIST, shopCanonical } from "@/features/catalog/query";
import { getFacets, getReleases, searchProducts, withFallback } from "@/server/catalog";
import { siteUrl } from "@/lib/env";
import { ALL_COLLECTIONS } from "@/shared";

export const revalidate = 3600;

const PAGES = ["", "/shop", "/about", "/contact", "/faq", "/refunds", "/privacy", "/terms"];

/** Every indexable address: the pages, each release, each category with pieces, each piece. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [releases, facets, products] = await Promise.all([
    withFallback(getReleases, []),
    withFallback(() => getFacets({}), EMPTY_FACETS),
    withFallback(() => searchProducts({ pageSize: 48 }), EMPTY_LIST),
  ]);
  const paths = [
    ...PAGES,
    ...releases.map((r) => shopCanonical(r.slug)),
    ...facets.categories
      .filter((c) => c.count > 0)
      .map((c) => shopCanonical(ALL_COLLECTIONS, c.slug)),
  ];
  return [
    // Next writes the address into the XML as it is, so the "&" between two params is escaped here.
    ...paths.map((path) => ({ url: `${siteUrl}${path}`.replace(/&/g, "&amp;") })),
    ...products.items.map((p) => ({
      url: `${siteUrl}/shop/${p.slug}`,
      lastModified: p.releasedAt,
      images: [p.image, p.hoverImage].flatMap((i) =>
        i ? [new URL(i.url, siteUrl).toString()] : [],
      ),
    })),
  ];
}
