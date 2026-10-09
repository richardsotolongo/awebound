import { Button, ScriptureQuote, ScriptureRef } from "@awebound/brand";
import type { ProductSummary } from "@/shared";
import { Reveal } from "@/components/reveal";
import { NotifyForm } from "@/features/bag/notify-form";
import { EMPTY_LIST } from "@/features/catalog/query";
import { DesignStory } from "@/features/home/design-story";
import { Hero } from "@/features/home/hero";
import { ReleaseCard } from "@/features/release/release-card";
import { getLatestRelease, getProduct, searchProducts, withFallback } from "@/server/catalog";
import { VERSES } from "@/server/scripture";

export const revalidate = 60;

/** The close-up of a piece's artwork shipped with the site, else its listing photo. */
function artImage(p: ProductSummary) {
  return p.image.url.startsWith("/products/")
    ? { url: `/products/${p.slug}/detail.webp`, alt: `${p.name}, artwork close up` }
    : { url: p.image.url, alt: p.image.alt };
}

/** Unique pieces by slug, in order. */
const unique = (items: (ProductSummary | undefined)[]) =>
  items.filter(
    (p, i, all): p is ProductSummary => !!p && all.findIndex((q) => q?.slug === p.slug) === i,
  );

/**
 * The home page, in order: the clothes and the brand in one screen, a short introduction to the
 * latest release, all of its pieces, two design stories, why Awebound exists, and the sign-up
 * for release updates.
 */
export default async function Home() {
  const release = await withFallback(getLatestRelease, null);
  const list = release
    ? await withFallback(
        () => searchProducts({ collection: [release.slug], pageSize: 48 }),
        EMPTY_LIST,
      )
    : EMPTY_LIST;
  const pieces = list.items;
  const featured = unique([...pieces.filter((p) => p.featured), ...pieces]).slice(0, 2);
  const stories = (
    await Promise.all(featured.map((p) => withFallback(() => getProduct(p.slug), null)))
  ).filter((p) => p !== null);
  // The hero shows the featured pieces and the one that carries the release's own verse.
  const heroPieces = unique([
    ...featured,
    pieces.find((p) => p.scripture.reference === release?.scriptureRef),
    ...pieces,
  ]).slice(0, 3);
  const preview = release?.status !== "open";

  return (
    <>
      <Hero release={release} pieces={heroPieces} />

      {release && pieces.length > 0 ? (
        <section id="behold" className="behold aw-container" aria-labelledby="behold-title">
          <div className="behold-intro">
            <div className="behold-name">
              <p className="aw-label">
                Latest drop · Release {release.number} · {release.pieces}{" "}
                {release.pieces === 1 ? "piece" : "pieces"}
              </p>
              <h2 id="behold-title" className="behold-title">
                {release.name}
              </h2>
            </div>
            <div className="behold-text">
              <p className="behold-tagline">{release.tagline}</p>
              <p className="aw-body">{release.story}</p>
              <ScriptureRef reference={release.scriptureRef} align="start" />
            </div>
          </div>

          <ul className="product-grid home-grid" aria-label={`The ${release.name} pieces`}>
            {pieces.map((p, i) => (
              <li key={p.slug}>
                <ReleaseCard product={p} priority={i < 3} />
              </li>
            ))}
          </ul>
          {preview ? (
            <p className="behold-note aw-small">
              {release.name} is in preview. Ordering isn’t open yet; you can save pieces to your bag
              and <a href="#updates">get an email when it opens</a>.
            </p>
          ) : null}
        </section>
      ) : null}

      {stories.length > 0 ? (
        <section className="stories" aria-labelledby="stories-title">
          <div className="aw-container">
            <Reveal className="stories-head">
              <p className="aw-label">Inside the designs</p>
              <h2 id="stories-title" className="aw-h1">
                Every design tells a story
              </h2>
            </Reveal>
            {stories.map(({ story, variants: _v, images: _i, ...summary }, i) => (
              <DesignStory
                key={summary.slug}
                product={summary}
                story={story}
                image={artImage(summary)}
                flip={i % 2 === 1}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section id="story" className="founder" data-theme="light" aria-labelledby="founder-title">
        <div className="aw-container founder-in">
          <Reveal className="founder-head">
            <p className="aw-label">Why Awebound</p>
            <h2 id="founder-title" className="aw-h1">
              Bound in awe
            </h2>
          </Reveal>
          <div className="founder-text">
            <p className="aw-body">
              Richard started Awebound for people who are not ashamed to express their faith and
              want to wear it boldly. He built it with faith at the forefront: every design begins
              in Scripture and tells a story about our Lord and Savior, Jesus Christ.
            </p>
            <p className="aw-body">
              To be bound in awe is to be held by who He is: holy, powerful, merciful, risen. That
              reverence shapes the work. Scripture is quoted exactly, with its full reference. God
              is shown through symbols, never drawn as a person. The artwork and lettering are made
              with the same care as the meaning they carry.
            </p>
            <p className="aw-body">
              Clothing goes where you go. When someone asks about what you’re wearing, you get to
              tell them who it points to. We plant the seed; God makes it grow.
            </p>
            <ScriptureQuote
              text={VERSES.planted.text}
              reference={VERSES.planted.reference}
              translation={VERSES.planted.translation}
              excerpt={VERSES.planted.excerpt}
              size="md"
            />
            <div className="aw-btn-row">
              <Button variant="secondary" href="/about">
                Read our story
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="updates" className="updates aw-grain" aria-labelledby="updates-title">
        <div className="aw-container updates-in">
          <div>
            <p className="aw-label">Release updates</p>
            <h2 id="updates-title" className="aw-h1">
              {release && preview
                ? `Know when ${release.name} opens`
                : "Hear about the next release"}
            </h2>
            <p className="aw-body">
              {release && preview
                ? `Ordering for ${release.name} isn’t open yet. Leave your email and we’ll tell you when the pieces are available to order.`
                : "Leave your email and we’ll tell you when the next release is ready."}
            </p>
          </div>
          <NotifyForm source="footer" label="Your email" />
        </div>
      </section>
    </>
  );
}
