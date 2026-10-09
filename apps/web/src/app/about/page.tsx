import { AltarPanel, Button, ScriptureQuote, ThornRule } from "@awebound/brand";
import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { TRANSLATION, TRANSLATION_NAME, VERSES } from "@/server/scripture";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Awebound exists: Christian apparel rooted in Scripture and reverence for Jesus Christ, for people who are not ashamed to express their faith.",
  alternates: { canonical: "/about" },
};

/** Why each part of a design is there. */
const TOGETHER = [
  {
    title: "Scripture",
    body: "Every design starts with one moment in Scripture that shows who Jesus Christ is. Not a slogan: a passage you can find, read and sit with.",
  },
  {
    title: "Biblical imagery",
    body: "A burning bush, a stilled sea, a rolled-away stone. Symbols let the moment be seen at a glance and remembered long after.",
  },
  {
    title: "Expressive lettering",
    body: "The words are drawn, not typed, with the weight the moment deserves, so they can be read from across a room.",
  },
  {
    title: "Clothing",
    body: "It goes where you go: to class, to work, into ordinary days. That is where the story gets seen, and where someone asks about it.",
  },
];

/** How every design is made. Written to hold for every release. */
const DESIGN_STORY = [
  {
    numeral: "I",
    title: "It begins in Scripture",
    body: "We choose one moment that calls people to see Jesus Christ as He is, and read it in context before anything is drawn.",
  },
  {
    numeral: "II",
    title: "The art holds the moment",
    body: "It is drawn as an engraving, in symbols only, so the moment can be seen and remembered. Out of reverence, we never put a face on God.",
  },
  {
    numeral: "III",
    title: "The reference carries it on",
    body: "The full reference is part of the design, so anyone who asks can look it up for themselves. The story doesn’t end with the person wearing it.",
  },
];

export default function AboutPage() {
  const reverence = [
    "Symbols only. Out of reverence, we never depict Jesus, God the Father or the Holy Spirit as a person.",
    `Scripture is quoted exactly, with its full reference. On this website we quote the ${TRANSLATION_NAME}.${
      TRANSLATION === "NIV"
        ? " Lettering printed on some designs uses the King James wording, and every approved design is kept exactly as it was drawn."
        : ""
    }`,
    "The design gets the same care as the meaning: considered artwork, honest materials and fits named plainly.",
    "No fear, no guilt, no hype. Just the story, worn boldly.",
  ];

  return (
    <>
      <AltarPanel
        eyebrow="Our story"
        title="Bound in awe. Worn without shame."
        body="Awebound creates clothing rooted in Scripture and reverence for Jesus Christ, for people who are not ashamed to express their faith."
      />

      <section data-theme="light" className="section about-founder" aria-labelledby="founder-title">
        <div className="aw-container about-split">
          <Reveal className="about-split-head">
            <p className="aw-label">Why Awebound exists</p>
            <h2 id="founder-title" className="aw-h1">
              Faith at the forefront
            </h2>
          </Reveal>
          <div className="about-split-body">
            <p className="aw-body">
              Richard started Awebound for people who are not ashamed to express their faith and
              want to wear it boldly. He built it with faith at the forefront of every design: each
              piece begins in Scripture and tells a story about our Lord and Savior, Jesus Christ.
            </p>
            <p className="aw-body">
              The hope is that every piece starts a conversation about Him. Not because the shirt
              does the talking, but because when someone asks what it means, the person wearing it
              gets to answer. We plant the seed; God makes it grow.
            </p>
            <ScriptureQuote
              text={VERSES.planted.text}
              reference={VERSES.planted.reference}
              translation={VERSES.planted.translation}
              excerpt={VERSES.planted.excerpt}
            />
          </div>
        </div>
      </section>

      <section className="section aw-grain about-awe" aria-labelledby="awe-title">
        <div className="aw-container about-split">
          <Reveal className="about-split-head">
            <p className="aw-label">The name</p>
            <h2 id="awe-title" className="aw-h1">
              What “bound in awe” means
            </h2>
          </Reveal>
          <div className="about-split-body">
            <p className="aw-body">
              Awe is what happens when you see God as He is: holy, powerful, merciful, risen. To be
              bound in awe is to be held there, letting reverence for Jesus Christ shape what you
              make, what you wear and how you live.
            </p>
            <p className="aw-body">
              Worn without shame is the other half. Paul wrote that he was not ashamed of the
              gospel, because it is the power of God. Awebound is made for people who feel the same
              way.
            </p>
            <ScriptureQuote
              text={VERSES.notAshamed.text}
              reference={VERSES.notAshamed.reference}
              translation={VERSES.notAshamed.translation}
              excerpt={VERSES.notAshamed.excerpt}
            />
          </div>
        </div>
      </section>

      <section className="section about-together" aria-labelledby="together-title">
        <div className="aw-container" style={{ display: "grid", gap: "var(--space-12)" }}>
          <Reveal className="about-together-head">
            <p className="aw-label">Why it belongs together</p>
            <h2 id="together-title" className="aw-h1">
              Scripture, art, lettering, clothing
            </h2>
            <p className="aw-body">
              Each part does a different job. Together they make something worth wearing and worth
              asking about.
            </p>
          </Reveal>
          <ul className="about-together-grid">
            {TOGETHER.map((item, i) => (
              <Reveal as="li" key={item.title} delay={i * 0.06}>
                <h3 className="aw-h3">{item.title}</h3>
                <p className="aw-body">{item.body}</p>
              </Reveal>
            ))}
          </ul>
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
              One moment from Scripture, drawn to be seen and lettered to be read. Whatever the
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

      <section className="section" aria-labelledby="reverence-title">
        <div className="aw-container" style={{ display: "grid", gap: "var(--space-12)" }}>
          <ThornRule />
          <div className="split split-even">
            <h2 id="reverence-title" className="aw-h1">
              How reverence shapes the work
            </h2>
            <ul className="prose" style={{ margin: 0 }}>
              {reverence.map((c) => (
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
