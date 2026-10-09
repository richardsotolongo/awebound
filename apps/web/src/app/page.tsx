import { Button } from "@awebound/brand";
import type { ProductSummary } from "@/shared";
import { Reveal } from "@/components/reveal";
import { EMPTY_LIST } from "@/features/catalog/query";
import { Opening } from "@/features/home-journey/opening";
import { SeedScene } from "@/features/home-journey/seed-scene";
import { BeholdReveal } from "@/features/home-journey/veil";
import { VisionIndex } from "@/features/home-journey/vision-index";
import { VisionScene } from "@/features/home-journey/vision-scene";
import { ReleaseCard } from "@/features/release/release-card";
import { searchProducts, withFallback } from "@/server/catalog";
import { RELEASE, VISIONS } from "@/lib/release";

export const revalidate = 60;

/**
 * The art for a scene: the print close-up shipped with the site while the catalog uses the
 * site's own images, else the provider's listing photo (Fourthwall).
 */
function sceneImage(slug: string, product?: ProductSummary) {
  const local = { url: `/products/${slug}/detail.webp`, alt: "" };
  if (!product) return local;
  return product.image.url.startsWith("/products/")
    ? { url: local.url, alt: `${product.name}, print close up` }
    : { url: product.image.url, alt: product.image.alt };
}

export default async function Home() {
  const catalog = await withFallback(
    () => searchProducts({ collection: [RELEASE.slug], pageSize: 48, sort: "featured" }),
    EMPTY_LIST,
  );
  const bySlug = new Map(catalog.items.map((p) => [p.slug, p]));

  return (
    <>
      <Opening />
      <BeholdReveal />

      <div id="visions" className="visions">
        <VisionIndex visions={VISIONS} containerId="visions" />
        {VISIONS.map((vision, i) => {
          const product = bySlug.get(vision.slug);
          return (
            <VisionScene
              key={vision.slug}
              vision={vision}
              product={product}
              image={sceneImage(vision.slug, product)}
              index={i}
            />
          );
        })}
      </div>

      {catalog.items.length > 0 ? (
        <section className="aw-container section release-section" aria-labelledby="release-title">
          <Reveal className="release-head">
            <p className="aw-label">
              Release {RELEASE.number} · {catalog.items.length} pieces
            </p>
            <h2 id="release-title" className="aw-h1">
              {RELEASE.name}
            </h2>
            <p className="aw-body">{RELEASE.tagline}</p>
          </Reveal>
          <ul className="product-grid release-grid">
            {catalog.items.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 3) * 0.06}>
                <ReleaseCard product={p} />
              </Reveal>
            ))}
          </ul>
          <div className="aw-btn-row" style={{ justifyContent: "center" }}>
            <Button variant="secondary" href="/shop">
              Shop the release
            </Button>
          </div>
        </section>
      ) : null}

      <SeedScene />
    </>
  );
}
