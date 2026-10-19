import { quoted } from "@awebound/brand";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { shopCanonical } from "@/features/catalog/query";
import { ProductView } from "@/features/product/product-view";
import { getPublishedPublicCard } from "@/server/archive/content";
import { getArchiveOffer } from "@/server/archive/offer";
import { getProduct, searchProducts, withFallback } from "@/server/catalog";
import { siteUrl } from "@/lib/env";
import { SITE, pageMeta } from "@/lib/site";
import { nameWithCut, pieceHref, slugAtAddress } from "@/shared";

type Params = Promise<{ slug: string }>;

// Each product page renders on its first visit and is then served from cache for a minute (the
// home page's freshness), so it is ready when a tile's image morphs into it. Nothing is rendered
// at build, so a Fourthwall outage during a deploy can't fail it.
export const revalidate = 60;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct(slugAtAddress((await params).slug).slug).catch(() => null);
  if (!product) return { title: "Not found" };
  const { scripture } = product;
  const cut = product.category.cut.toLowerCase();
  return pageMeta({
    path: pieceHref(product.slug),
    title: `${nameWithCut(product)} · ${scripture.reference}`,
    description: `${product.name}, ${cut} from ${product.collection.name}. ${quoted(scripture.text)} ${scripture.reference} (${scripture.translation}). ${product.story.art}`,
    image: { url: product.image.url, alt: product.image.alt },
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  // A renamed piece's old address moves to its new one (Fear Not was The Passage).
  const { slug, moved } = slugAtAddress((await params).slug);
  if (moved) permanentRedirect(pieceHref(slug));
  const product = await getProduct(slug);
  if (!product) notFound();

  const release = await withFallback(
    () => searchProducts({ collection: [product.collection.slug], pageSize: 48 }),
    { items: [], total: 0, page: 1, pageSize: 48, hasMore: false },
  );
  const pieces = [...release.items].sort((a, b) => a.position - b.position);
  const { story } = product;
  // Only the published public fields of the Archive card reach this cached page.
  const [card, offer] = await Promise.all([
    withFallback(() => getPublishedPublicCard(product.slug), null),
    getArchiveOffer(),
  ]);

  const url = `${siteUrl}${pieceHref(product.slug)}`;
  const prices = product.variants.map((v) => v.priceCents);
  const [low, high] = [Math.min(...prices), Math.max(...prices)].map((c) => (c / 100).toFixed(2));
  // No sku: preview SKUs carry the internal design code. No offer for a preview either: it can't
  // be ordered yet and its price isn't final. The offer appears once the piece is in Fourthwall.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: `${story.art} ${story.meaning}`,
    image: product.images.map((i) => new URL(i.url, siteUrl).toString()),
    url,
    brand: { "@type": "Brand", name: SITE.name },
    category: product.category.name,
    color: product.colors.map((c) => c.name).join(", "),
    ...(story.material ? { material: story.material } : {}),
    ...(product.preview || prices.length === 0
      ? {}
      : {
          offers: {
            "@type": low === high ? "Offer" : "AggregateOffer",
            url,
            priceCurrency: product.currency,
            ...(low === high
              ? { price: low }
              : { lowPrice: low, highPrice: high, offerCount: prices.length }),
            availability: product.variants.some((v) => v.available)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        }),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Shop", item: `${siteUrl}/shop` },
      {
        name: product.collection.name,
        item: `${siteUrl}${shopCanonical(product.collection.slug)}`,
      },
      { name: product.name, item: url },
    ].map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })),
  };

  return (
    <>
      <ProductView product={product} pieces={pieces} card={card} offer={offer} />

      <JsonLd data={jsonLd} />
      <JsonLd data={crumbs} />
    </>
  );
}
