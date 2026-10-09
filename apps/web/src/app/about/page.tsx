import { AltarPanel, Button, ScriptureRef, ThornRule } from "@awebound/brand";
import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "Awebound is Christian apparel for people who are not ashamed to wear their faith. Every design tells a story about Jesus Christ.",
  alternates: { canonical: "/about" },
};

const STORY = [
  {
    title: "Faith first",
    body: "Awebound was built with faith at the forefront of every design. Each piece starts with a passage of Scripture and the story it tells. The art comes second, and it has to be worthy of the first.",
  },
  {
    title: "Made to start conversations",
    body: "A shirt is a quiet way to say something out loud. When someone asks what yours means, you get to tell them about Jesus Christ. That is the seed. We plant it; God makes it grow.",
  },
];

/** How every design tells its story. Written to hold for every release, not just this one. */
const DESIGN_STORY = [
  {
    numeral: "I",
    title: "It begins in Scripture",
    body: "Every design starts with one moment in Scripture that shows who Jesus Christ is. Not a slogan. A moment you can find, read and sit with.",
  },
  {
    numeral: "II",
    title: "The art holds the moment",
    body: "We draw it as an engraving, in symbols only, so the moment can be seen and remembered. Out of reverence, we never put a face on God.",
  },
  {
    numeral: "III",
    title: "The reference carries it on",
    body: "The full reference is printed with the art, so anyone who asks can look it up for themselves. The story doesn’t end with the person wearing it. It gets passed on.",
  },
];

const COMMITMENTS = [
  "Symbols only. Out of reverence, we never depict Jesus, God the Father or the Holy Spirit as a person.",
  "Scripture by full reference on every piece, so it can be looked up and read. When we quote a verse, on a piece or on this site, we use the King James Version.",
  "The clothes come first: considered art, honest materials and fits named plainly.",
  "No fear, no guilt, no hype. Just the story, worn boldly.",
];

export default function AboutPage() {
  return (
    <>
      <AltarPanel
        eyebrow="Our story"
        title="Not ashamed"
        body="Awebound is Christian apparel for people who are not ashamed to express their faith. Our goal is simple: that every piece starts a conversation about Jesus Christ, and that every design tells a story about our Lord and Savior."
        scripture="Romans 1:16"
      />

      <section
        data-theme="light"
        className="section"
        style={{ background: "var(--surface-page)", color: "var(--ink)" }}
        aria-labelledby="story-title"
      >
        <div className="aw-container" style={{ display: "grid", gap: "var(--space-16)" }}>
          <h2 id="story-title" className="visually-hidden">
            What we believe
          </h2>
          <div
            style={{
              display: "grid",
              gap: "var(--space-12)",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {STORY.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <article style={{ display: "grid", gap: "var(--space-4)" }}>
                  <h3 className="aw-h3">{s.title}</h3>
                  <p className="aw-body">{s.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <figure
              style={{
                margin: 0,
                display: "grid",
                gap: "var(--space-4)",
                justifyItems: "center",
                textAlign: "center",
              }}
            >
              <blockquote className="aw-h2" style={{ margin: 0, maxWidth: "24ch" }}>
                For I am not ashamed of the gospel of Christ.
              </blockquote>
              <figcaption>
                <ScriptureRef reference="Romans 1:16" translation="KJV" />
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="section aw-grain design-story" aria-labelledby="design-story-title">
        <div className="aw-container design-story-inner">
          <Reveal className="design-story-head">
            <p className="aw-label">How we make it</p>
            <h2 id="design-story-title" className="aw-h1">
              Every design tells a story
            </h2>
            <p className="aw-body">
              One moment from Scripture, drawn to be seen and printed to be read. Whatever the
              release, every piece is made this way.
            </p>
          </Reveal>
          <ol className="design-story-steps">
            {DESIGN_STORY.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 0.08}>
                <span className="design-story-num" aria-hidden="true">
                  {step.numeral}
                </span>
                <h3 className="aw-h3">{step.title}</h3>
                <p className="aw-body">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="commitments-title" style={{ paddingTop: 0 }}>
        <div className="aw-container" style={{ display: "grid", gap: "var(--space-12)" }}>
          <ThornRule />
          <div className="split split-even">
            <h2 id="commitments-title" className="aw-h2">
              What we hold to
            </h2>
            <ul className="prose" style={{ margin: 0 }}>
              {COMMITMENTS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="aw-btn-row">
            <Button variant="primary" href="/shop">
              Visit the shop
            </Button>
            <Button variant="secondary" href="/contact">
              Write to us
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
