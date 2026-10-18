import "server-only";
import { EMPTY_FACETS, shopCanonical } from "@/features/catalog/query";
import { GUIDES, GUIDES_PATH, guideHref } from "@/features/guides/guides";
import { siteUrl } from "@/lib/env";
import { ALL_COLLECTIONS, pieceHref } from "@/shared";
import { allProducts, getFacets, getReleases, withFallback } from "./catalog";

const PAGES = ["", "/shop", "/about", "/contact", "/faq", "/refunds", "/privacy", "/terms"];

export interface IndexablePage {
  /** From the site root, query included: "/shop?category=hoodies". */
  path: string;
  lastModified?: string;
  /** Absolute image addresses, for the sitemap. */
  images?: string[];
}

/**
 * Every address search engines should index: the pages, the unlisted guides, each release, each
 * category with pieces and each piece. The sitemap and IndexNow both read it.
 */
export async function indexablePages(): Promise<IndexablePage[]> {
  const [releases, facets, products] = await Promise.all([
    withFallback(getReleases, []),
    withFallback(() => getFacets({}), EMPTY_FACETS),
    withFallback(allProducts, []),
  ]);
  const paths = [
    ...PAGES,
    GUIDES_PATH,
    ...GUIDES.map((g) => guideHref(g.slug)),
    ...releases.map((r) => shopCanonical(r.slug)),
    ...facets.categories
      .filter((c) => c.count > 0)
      .map((c) => shopCanonical(ALL_COLLECTIONS, c.slug)),
  ];
  return [
    ...paths.map((path) => ({ path })),
    ...products.map((p) => ({
      path: pieceHref(p.slug),
      lastModified: p.releasedAt,
      images: [p.image, p.hoverImage].flatMap((i) =>
        i ? [new URL(i.url, siteUrl).toString()] : [],
      ),
    })),
  ];
}
