import { Button } from "@awebound/brand";
import type { ProductSummary, Release } from "@/shared";
import Link from "next/link";

interface HeroProps {
  release: Release | null;
  /** Up to three pieces to show beside the words; the first is shown largest. */
  pieces: ProductSummary[];
}

/**
 * The first screen: the clothes beside the headline, the brand paragraph and the release
 * status. While the release is in preview the buttons say so (Explore, Get Release Updates);
 * once every piece can be ordered they switch to shopping.
 */
export function Hero({ release, pieces }: HeroProps) {
  const preview = release?.status !== "open";
  return (
    <section className="hero aw-grain" aria-labelledby="hero-title">
      <div className="hero-in aw-container">
        <div className="hero-text">
          <p className="aw-label">Christian apparel</p>
          <h1 id="hero-title" className="hero-title">
            <span>Bound in awe.</span> <span>Worn without shame.</span>
          </h1>
          <p className="hero-body">
            Awebound creates clothing rooted in Scripture and reverence for Jesus Christ. Bold
            artwork and expressive lettering carry the stories of His holiness, mercy, and
            resurrection into the everyday.
          </p>
          {release && preview ? (
            <p className="release-status">
              <span className="release-status-dot" aria-hidden="true" />
              Release {release.number} — {release.name} — Coming Soon
            </p>
          ) : null}
          <div className="aw-btn-row">
            {release ? (
              <Button variant="primary" href={preview ? "#behold" : `/collections/${release.slug}`}>
                {preview ? `Explore ${release.name}` : `Shop ${release.name}`}
              </Button>
            ) : (
              <Button variant="primary" href="/shop">
                Visit the shop
              </Button>
            )}
            {preview ? (
              <Button variant="secondary" href="#updates">
                Get Release Updates
              </Button>
            ) : (
              <Button variant="secondary" href="#story">
                Our Story
              </Button>
            )}
          </div>
        </div>

        {pieces.length > 0 ? (
          <ul className="hero-pieces" data-count={pieces.length}>
            {pieces.map((p, i) => (
              <li key={p.slug}>
                <Link href={`/shop/${p.slug}`} className="hero-piece">
                  {/* eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN */}
                  <img
                    src={p.image.url}
                    alt={p.image.alt}
                    loading="eager"
                    fetchPriority={i === 0 ? "high" : "auto"}
                    decoding="async"
                  />
                  <span className="hero-piece-name">{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
