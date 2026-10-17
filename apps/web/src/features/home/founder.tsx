import { Button } from "@awebound/brand";

/**
 * Richard's note, in his own words (supplied October 2026; the full story is on About). Change
 * the wording only with him. The portrait's caption and alt name him and nothing he is wearing.
 */
export function Founder() {
  return (
    <section className="founder" data-theme="light" aria-labelledby="founder-title">
      <div className="aw-container founder-in">
        {/* eslint-disable-next-line @next/next/no-img-element -- static portrait with srcset */}
        <img
          className="founder-portrait"
          src="/about/richard-960.webp"
          srcSet="/about/richard-480.webp 480w, /about/richard-960.webp 960w"
          sizes="(max-width: 599px) 128px, (max-width: 899px) 240px, 380px"
          width={960}
          height={1200}
          alt="Portrait of Richard"
          loading="lazy"
          decoding="async"
        />
        <div className="founder-words">
          <h2 id="founder-title" className="aw-h1">
            My faith in God comes first.
          </h2>
          <p className="aw-small">Richard, founder of Awebound</p>
          <p className="aw-body">
            I started Awebound with a desire to serve Christ and others through clothing rooted in
            Scripture. Each piece brings together expressive artwork and biblical meaning, with the
            hope that it encourages the person wearing it and opens the door to conversations about
            Jesus Christ.
          </p>
          <Button variant="secondary" href="/about">
            Read my story
          </Button>
        </div>
      </div>
    </section>
  );
}
