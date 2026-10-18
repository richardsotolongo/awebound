import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { GuideBlocks, MoreGuides } from "@/features/guides/guide-blocks";
import { GUIDES_PATH, findGuide, guideHref, type Guide } from "@/features/guides/guides";
import { siteUrl } from "@/lib/env";
import { SITE, pageMeta } from "@/lib/site";
import { allProducts, getProduct, withFallback } from "@/server/catalog";
import { pieceHref } from "@/shared";

// Cached like product pages: rendered on the first visit, then refreshed every minute, so a
// deploy never waits on Fourthwall and the cards keep live prices.
export const revalidate = 60;
export function generateStaticParams() {
  return [];
}

type Params = Promise<{ slug: string }>;

/** The pieces a guide shows, with their stories and size guides, in the guide's order. */
async function guidePieces({ pieces }: Guide) {
  const list = await withFallback(allProducts, []);
  const chosen =
    pieces === "all"
      ? list
      : "slugs" in pieces
        ? pieces.slugs.flatMap((slug) => list.filter((p) => p.slug === slug))
        : list.filter((p) => p.category.slug === pieces.category);
  const details = await Promise.all(
    chosen.map((p) => withFallback(() => getProduct(p.slug), null)),
  );
  return details.filter((p) => p !== null);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const guide = findGuide((await params).slug);
  if (!guide) return { title: "Not found" };
  return pageMeta({
    path: guideHref(guide.slug),
    title: guide.title,
    description: guide.description,
  });
}

/** An unlisted guide (features/guides/guides.ts): reached from search, never from the site's navigation. */
export default async function GuidePage({ params }: { params: Params }) {
  const guide = findGuide((await params).slug);
  if (!guide) notFound();
  const pieces = await guidePieces(guide);
  const url = `${siteUrl}${guideHref(guide.slug)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: guide.title,
        description: guide.description,
        isPartOf: { "@type": "WebSite", name: SITE.name, url: siteUrl },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: pieces.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.name,
            url: `${siteUrl}${pieceHref(p.slug)}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Christian apparel", item: `${siteUrl}${GUIDES_PATH}` },
          { name: guide.heading, item: url },
        ].map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })),
      },
    ],
  };

  return (
    <div className="aw-container guide">
      <PageHeader title={guide.heading} intro={<p>{guide.intro}</p>} />
      <GuideBlocks blocks={guide.blocks} pieces={pieces} />
      <MoreGuides current={guide.slug} />
      <JsonLd data={jsonLd} />
    </div>
  );
}
