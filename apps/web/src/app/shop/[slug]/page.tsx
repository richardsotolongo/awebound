import { ProductCard, ScriptureRef, ThornRule } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/reveal";
import { toCardProps } from "@/features/catalog/query";
import { ProductGallery } from "@/features/product/product-gallery";
import { ProductPurchase } from "@/features/product/product-purchase";
import { siteUrl } from "@/lib/env";
import { getProduct, searchProducts, withFallback } from "@/server/catalog";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).slug).catch(() => null);
  if (!product) return { title: "Not found" };
  const description = `${product.story.art} ${product.category.cut} · ${product.baseColor}. ${product.scriptureRef}.`;
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

  const related = await withFallback(
    () => searchProducts({ collection: [product.collection.slug], pageSize: 5 }),
    { items: [], total: 0, page: 1, pageSize: 5, hasMore: false },
  );
  const others = related.items.filter((p) => p.slug !== product.slug).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.code,
    description: product.story.art,
    image: product.images.map((i) => new URL(i.url, siteUrl).toString()),
    brand: { "@type": "Brand", name: "Awebound" },
    category: product.category.name,
  };

  return (
    <div className="aw-container">
      <nav aria-label="Breadcrumb" className="aw-small" style={{ paddingBlock: "var(--space-6)" }}>
        <Link href="/shop" style={{ color: "var(--ink-muted)" }}>
          Shop
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          href={`/collections/${product.collection.slug}`}
          style={{ color: "var(--ink-muted)" }}
        >
          {product.collection.name}
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp">
        <ProductGallery images={product.images} name={product.name} />

        <div className="buy">
          <div className="buy-head">
            <span className="aw-meta">{product.code}</span>
            <h1 className="aw-h1">{product.name}</h1>
            <p className="aw-small">
              {product.category.cut} · {product.collection.name}
            </p>
          </div>

          <ProductPurchase product={product} />

          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <p className="aw-body" style={{ color: "var(--ink)" }}>
              {product.story.art}
            </p>
            <ScriptureRef reference={product.scriptureRef} align="start" />
            <p className="aw-small">{product.story.paraphrase}</p>
          </div>

          <dl className="spec">
            <dt className="aw-label">Front</dt>
            <dd>{product.story.front}</dd>
            <dt className="aw-label">Back</dt>
            <dd>{product.story.back}</dd>
            <dt className="aw-label">Base</dt>
            <dd>{product.colors.map((c) => c.name).join(", ")}</dd>
            <dt className="aw-label">Inks</dt>
            <dd>{product.story.inks}</dd>
            <dt className="aw-label">Fit</dt>
            <dd>{product.story.fit}</dd>
            <dt className="aw-label">Fabric</dt>
            <dd>
              {product.story.material ??
                "Fabric details will be posted with the first production run."}
            </dd>
          </dl>

          <p className="field-help">
            Made to order. Questions about fit?{" "}
            <Link href="/contact" style={{ color: "var(--accent-text)" }}>
              Ask us
            </Link>
            .
          </p>
        </div>
      </div>

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
              Shop {product.collection.name}
            </Link>
          </div>
          <ul
            className="product-grid"
            data-wide="true"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            {others.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 0.05}>
                <ProductCard {...toCardProps(p)} />
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
