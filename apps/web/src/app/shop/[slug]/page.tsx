import { ScriptureQuote, quoted } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { JsonLd } from "@/components/json-ld";
import { shopCanonical } from "@/features/catalog/query";
import { PieceNav } from "@/features/product/piece-nav";
import { ProductGallery } from "@/features/product/product-gallery";
import { ProductPurchase } from "@/features/product/product-purchase";
import { StoryBand } from "@/features/product/story-band";
import { DesignContext } from "@/features/archive/design-context";
import { productNote } from "@/features/archive/offer";
import { ProductArchiveNote } from "@/features/archive/product-archive-note";
import { getPublishedPublicCard } from "@/server/archive/content";
import { getArchiveOffer } from "@/server/archive/offer";
import { ReleaseWall } from "@/features/release/release-wall";
import { getProduct, searchProducts, withFallback } from "@/server/catalog";
import { siteUrl } from "@/lib/env";
import { SITE, pageMeta } from "@/lib/site";
import { plateCss } from "@/shared";

type Params = Promise<{ slug: string }>;

// Each product page renders on its first visit and is then served from cache for a minute (the
// home page's freshness), so it is ready when a tile's image morphs into it. Nothing is rendered
// at build, so a Fourthwall outage during a deploy can't fail it.
export const revalidate = 60;
export function generateStaticParams() {
  return [];
}

/** Moving between neighbouring pieces: the page slides in from the side it lies on. */
const SLIDE = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).slug).catch(() => null);
  if (!product) return { title: "Not found" };
  const { scripture } = product;
  const cut = product.category.cut.toLowerCase();
  return pageMeta({
    path: `/shop/${product.slug}`,
    title: `${product.name} ${cut} · ${product.collection.name}`,
    description: `${product.name}, ${cut} from ${product.collection.name}. ${quoted(scripture.text)} ${scripture.reference} (${scripture.translation}). ${product.story.art}`,
    image: { url: product.image.url, alt: product.image.alt },
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const release = await withFallback(
    () => searchProducts({ collection: [product.collection.slug], pageSize: 48 }),
    { items: [], total: 0, page: 1, pageSize: 48, hasMore: false },
  );
  const pieces = [...release.items].sort((a, b) => a.position - b.position);
  const at = pieces.findIndex((p) => p.slug === product.slug);
  const prev = at > 0 ? pieces[at - 1] : undefined;
  const next = at >= 0 && at < pieces.length - 1 ? pieces[at + 1] : undefined;
  const others = pieces.filter((p) => p.slug !== product.slug);
  const { scripture, story } = product;
  // Only the published public fields of the Archive card reach this cached page.
  const [card, offer] = await Promise.all([
    withFallback(() => getPublishedPublicCard(product.slug), null),
    getArchiveOffer(),
  ]);
  // What buying the piece opens in My Archive, shown wherever accounts are open.
  const note = offer.accounts ? productNote(product.name) : null;

  const url = `${siteUrl}/shop/${product.slug}`;
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
      <ViewTransition key={product.slug} enter={SLIDE} exit={SLIDE} default="none">
        <div className="pdp-page">
          <div className="pdp">
            <ProductGallery
              images={product.images}
              name={product.name}
              slug={product.slug}
              plate={plateCss(product.plate)}
            />

            <div className="buy">
              <nav aria-label="Breadcrumb" className="aw-small crumbs">
                <Link href="/shop">Shop</Link>
                <span aria-hidden="true"> / </span>
                <Link href={shopCanonical(product.collection.slug)}>{product.collection.name}</Link>
                <span aria-hidden="true"> / </span>
                <span aria-current="page">{product.name}</span>
              </nav>
              <h1 className="buy-name">{product.name}</h1>
              <ProductPurchase product={product}>
                <ScriptureQuote
                  text={scripture.text}
                  reference={scripture.reference}
                  translation={scripture.translation}
                  excerpt={scripture.excerpt}
                  size="md"
                />
              </ProductPurchase>
              {note ? <ProductArchiveNote slug={product.slug} {...note} /> : null}
            </div>
          </div>

          <StoryBand product={product} />
          {card ? <DesignContext card={card} opens={offer.accounts} /> : null}

          <section className="aw-container details" aria-labelledby="details-title">
            <h2 id="details-title" className="aw-h2">
              Product details
            </h2>
            <div>
              <dl className="spec">
                <dt>Garment</dt>
                <dd>{product.category.cut}</dd>
                <dt>Fit</dt>
                <dd>{story.fit}</dd>
                <dt>{product.colors.length > 1 ? "Colors" : "Color"}</dt>
                <dd>{product.colors.map((c) => c.name).join(", ")}</dd>
                <dt>Front</dt>
                <dd>{story.front}</dd>
                <dt>Back</dt>
                <dd>{story.back}</dd>
                <dt>{story.process === "embroidered" ? "Thread" : "Inks"}</dt>
                <dd>{story.inks}</dd>
                <dt>Fabric</dt>
                <dd>{story.material ?? "Ask us for fabric details."}</dd>
              </dl>
              <p className="field-help">
                Questions about fit? <Link href="/contact">Ask us</Link>.
              </p>
            </div>
          </section>

          <PieceNav prev={prev} next={next} />

          {others.length > 0 ? (
            <section className="more" aria-labelledby="related-title">
              <h2 id="related-title" className="aw-container aw-h2">
                More from {product.collection.name}
              </h2>
              <ReleaseWall
                nameOnLeave
                pieces={others}
                label={`More ${product.collection.name} pieces`}
                more={{
                  href: shopCanonical(product.collection.slug),
                  label: `See all ${pieces.length} pieces`,
                }}
              />
            </section>
          ) : null}
        </div>
      </ViewTransition>

      <JsonLd data={jsonLd} />
      <JsonLd data={crumbs} />
    </>
  );
}
