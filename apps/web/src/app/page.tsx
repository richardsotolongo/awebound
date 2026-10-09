import { AltarPanel, CollectionBanner, ProductCard, ThornRule } from "@awebound/brand";
import type { ProductSummary } from "@/shared";
import Link from "next/link";
import { Fragment } from "react";
import { Reveal } from "@/components/reveal";
import { EMPTY_LIST, toCardProps } from "@/features/catalog/query";
import { Opening } from "@/features/home-journey/opening";
import { PillarScene } from "@/features/home-journey/pillar-scene";
import { searchProducts, withFallback } from "@/server/catalog";
import { PILLARS } from "@/lib/site";

export const revalidate = 60;

function Rail({ title, items, href }: { title: string; items: ProductSummary[]; href: string }) {
  if (items.length === 0) return null;
  return (
    <section className="aw-container journey-rail" aria-label={title}>
      <div className="journey-rail-head">
        <p className="aw-label">{title}</p>
        <Link href={href} className="aw-btn aw-btn-link">
          See all
        </Link>
      </div>
      <ul className="scroll-rail" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i * 0.06}>
            <ProductCard {...toCardProps(p)} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export default async function Home() {
  const catalog = await withFallback(
    () => searchProducts({ pageSize: 48, sort: "featured" }),
    EMPTY_LIST,
  );
  const inCollection = (slug: string) =>
    catalog.items.filter((p) => p.collection.slug === slug).slice(0, 3);

  // The newest drop is the collection with the most recent release.
  const newest = [...catalog.items].sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))[0];
  const newestPillar = PILLARS.find((p) => p.slug === newest?.collection.slug);
  const featured = catalog.items.filter((p) => p.featured).slice(0, 4);

  return (
    <>
      <Opening />

      <div id="pillars" className="aw-container journey-intro">
        <ThornRule />
        <Reveal className="journey-intro-text">
          <p className="aw-label">Three pillars</p>
          <p className="aw-h2">Royal heritage. Freedom. Resurrection.</p>
          <p className="aw-body">
            Every design carries one of them. Scroll to see what each one holds.
          </p>
        </Reveal>
      </div>

      {PILLARS.map((pillar, i) => (
        <Fragment key={pillar.slug}>
          <PillarScene pillar={pillar} index={i} />
          <Rail
            title={`From ${pillar.family}`}
            items={inCollection(pillar.slug)}
            href={`/collections/${pillar.slug}`}
          />
        </Fragment>
      ))}

      {newestPillar ? (
        <CollectionBanner
          tone="feature"
          pillar="New drop"
          family={newestPillar.family}
          story={newestPillar.story}
          action={{
            label: `Shop ${newestPillar.family}`,
            href: `/collections/${newestPillar.slug}`,
          }}
        />
      ) : null}

      {featured.length > 0 ? (
        <section className="aw-container section" aria-labelledby="featured-title">
          <div className="journey-rail-head" style={{ marginBottom: "var(--space-8)" }}>
            <h2 id="featured-title" className="aw-h2">
              Begin here
            </h2>
            <Link href="/shop" className="aw-btn aw-btn-link">
              Shop all
            </Link>
          </div>
          <ul
            className="product-grid"
            data-wide="true"
            style={{ listStyle: "none", margin: 0, padding: 0 }}
          >
            {featured.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 0.06}>
                <ProductCard {...toCardProps(p)} />
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      <AltarPanel
        eyebrow="Our story"
        title="Faith at the forefront"
        body="Awebound is for people who are not ashamed to wear their faith. Every design tells a story about our Lord and Savior, and every piece is made to start a conversation about him."
        scripture="Romans 1:16"
        action={{ label: "Read our story", href: "/about" }}
      />
    </>
  );
}
