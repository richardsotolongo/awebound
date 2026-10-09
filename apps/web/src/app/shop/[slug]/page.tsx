import { ScriptureQuote, ThornRule, quoted } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/reveal";
import { ProductGallery } from "@/features/product/product-gallery";
import { ProductPurchase } from "@/features/product/product-purchase";
import { ReleaseCard } from "@/features/release/release-card";
import { getProduct, searchProducts, withFallback } from "@/server/catalog";
import { siteUrl } from "@/lib/env";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).slug).catch(() => null);
  if (!product) return { title: "Not found" };
  const { scripture } = product;
  const description = `${product.name}, ${product.category.cut.toLowerCase()} from ${product.collection.name}. ${quoted(scripture.text)} ${scripture.reference} (${scripture.translation}). ${product.story.art}`;
  return {
    title: `${product.name} · ${product.collection.name}`,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: [{ url: product.image.url, alt: product.image.alt }],
    },
  };
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
  const others = pieces.filter((p) => p.slug !== product.slug).slice(0, 3);
  const { scripture, story } = product;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: `${story.art} ${story.meaning}`,
    image: product.images.map((i) => new URL(i.url, siteUrl).toString()),
    brand: { "@type": "Brand", name: "Awebound" },
    category: product.category.name,
  };

  return (
    <div className="aw-container">
      <nav aria-label="Breadcrumb" className="aw-small crumbs">
        <Link href="/shop">Shop</Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/collections/${product.collection.slug}`}>{product.collection.name}</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp">
        <ProductGallery images={product.images} name={product.name} />

        <div className="buy">
          <div className="buy-head">
            <p className="aw-label">
              <Link href={`/collections/${product.collection.slug}`}>
                {product.collection.name}
              </Link>{" "}
              · {product.category.cut}
            </p>
            <h1 className="buy-name">{product.name}</h1>
            <ScriptureQuote
              text={scripture.text}
              reference={scripture.reference}
              translation={scripture.translation}
              excerpt={scripture.excerpt}
              size="md"
            />
          </div>

          <ProductPurchase product={product} />

          <section className="buy-story" aria-labelledby="design-title">
            <p className="aw-label">The design · {story.theme}</p>
            <h2 id="design-title" className="aw-h2">
              {story.call}
            </h2>
            <p className="aw-body buy-story-art">{story.art}</p>
            <p className="aw-body">{story.meaning}</p>
          </section>

          <section aria-labelledby="details-title" className="buy-details">
            <h2 id="details-title" className="aw-label">
              Product details
            </h2>
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
              <dt>{product.category.slug === "hats" ? "Thread" : "Inks"}</dt>
              <dd>{story.inks}</dd>
              <dt>Fabric</dt>
              <dd>
                {story.material ?? "Fabric details will be posted with the first production run."}
              </dd>
            </dl>
            <p className="field-help">
              Questions about fit? <Link href="/contact">Ask us</Link>.
            </p>
          </section>
        </div>
      </div>

      {prev || next ? (
        <nav className="piece-nav" aria-label="Other pieces in this release">
          {prev ? (
            <Link href={`/shop/${prev.slug}`} rel="prev" className="piece-nav-link">
              <span className="aw-label">Previous</span>
              <span className="aw-product-name">{prev.name}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/shop/${next.slug}`}
              rel="next"
              className="piece-nav-link"
              data-next="true"
            >
              <span className="aw-label">Next</span>
              <span className="aw-product-name">{next.name}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}

      {others.length > 0 ? (
        <section className="section" aria-labelledby="related-title" style={{ paddingTop: 0 }}>
          <ThornRule />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              margin: "var(--space-12) 0 var(--space-8)",
            }}
          >
            <h2 id="related-title" className="aw-h2">
              More from {product.collection.name}
            </h2>
            <Link href={`/collections/${product.collection.slug}`} className="aw-btn aw-btn-link">
              See all {pieces.length}
            </Link>
          </div>
          <ul className="product-grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {others.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 0.05}>
                <ReleaseCard product={p} />
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
