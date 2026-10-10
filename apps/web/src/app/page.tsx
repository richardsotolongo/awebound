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

/** A piece in its stone niche, rendered for each piece by assets/mockups/compose.py. */
function scene(p: ProductSummary, art: string) {
  return {
    niche: `/products/${p.slug}/story-niche.webp`,
    piece: `/products/${p.slug}/story-piece.webp`,
    alt: `${p.name}: ${art}`,
  };
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
              {release.name} is in preview, so ordering isn’t open yet. You can add pieces to your
              bag now and <a href="#updates">get an email when it opens</a>.
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
                scene={scene(summary, story.art)}
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
              Richard started Awebound for believers who aren’t ashamed of the gospel and want to
              wear their faith openly. Every design starts with a passage of Scripture and tells
              part of the story of Jesus Christ, our Lord and Savior.
            </p>
            <p className="aw-body">
              Being bound in awe means being held by who He is, and we try to work that way.
              Scripture is quoted word for word, with the full reference. God is shown through
              symbols and never drawn as a person. The art and lettering get the same care as the
              verses they carry.
            </p>
            <p className="aw-body">
              Clothes go wherever you go. When someone asks about your shirt, you get to tell them
              who it points to. We plant the seed, and God makes it grow.
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
