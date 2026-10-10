import { AltarPanel, Button, ScriptureQuote, ThornRule } from "@awebound/brand";
import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { TRANSLATION, TRANSLATION_NAME, VERSES } from "@/server/scripture";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who started Awebound and why: Christian apparel rooted in Scripture and reverence for Jesus Christ, for people who aren’t ashamed of their faith.",
  alternates: { canonical: "/about" },
};

/** Why each part of a design is there. */
const TOGETHER = [
  {
    title: "Scripture",
    body: "Every design starts with one moment in Scripture that shows who Jesus is. It’s a passage you can look up, read in context and come back to.",
  },
  {
    title: "Biblical imagery",
    body: "A calmed sea, a crown of thorns breaking into lilies, a stone rolled away. A symbol lets you take in the moment at a glance and remember it later.",
  },
  {
    title: "Expressive lettering",
    body: "The words are drawn as part of the artwork, with the weight the moment deserves, so you can read them from across a room.",
  },
  {
    title: "Clothing",
    body: "Clothes go where you go, to class, to work, to the grocery store. That’s where people see the story and ask you about it.",
  },
];

/** How every design is made. Written to hold for every release. */
const DESIGN_STORY = [
  {
    numeral: "I",
    title: "It begins in Scripture",
    body: "We pick one moment that shows Jesus as He is, and we read it in context before anything gets drawn.",
  },
  {
    numeral: "II",
    title: "The art holds the moment",
    body: "The art tells the moment through symbols, so it’s easy to see and hard to forget. Out of reverence, we never put a face on God.",
  },
  {
    numeral: "III",
    title: "The reference carries it on",
    body: "The full reference is printed on every design, so anyone who asks can look it up and read the rest for themselves.",
  },
];

export default function AboutPage() {
  const reverence = [
    "We use symbols. Out of reverence, we never show Jesus, God the Father or the Holy Spirit as a person.",
    `Scripture is quoted word for word, with its full reference. On this website we quote the ${TRANSLATION_NAME}.${
      TRANSLATION === "NIV"
        ? " Some designs print the King James wording, and we keep every approved design exactly as it was drawn."
        : ""
    }`,
    "The design gets as much care as the meaning, and every product page names its fit plainly.",
    "We don’t sell with fear, guilt or hype. We tell the story and let it stand.",
  ];

  return (
    <>
      <AltarPanel
        eyebrow="Our story"
        title="Bound in awe. Worn without shame."
        body="Awebound makes clothing rooted in Scripture and reverence for Jesus Christ, for people who aren’t ashamed of their faith."
      />

      <section data-theme="light" className="section about-founder" aria-labelledby="founder-title">
        <div className="aw-container about-split">
          <Reveal className="about-split-head">
            <p className="aw-label">Why Awebound exists</p>
            <h2 id="founder-title" className="aw-h1">
              Faith at the forefront
            </h2>
            <figure className="founder-photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- static portrait with srcset */}
              <img
                src="/about/richard-960.webp"
                srcSet="/about/richard-480.webp 480w, /about/richard-960.webp 960w"
                sizes="(max-width: 1023px) min(100vw - 32px, 420px), 420px"
                width={960}
                height={1200}
                alt="Richard, founder of Awebound, smiling, in the Lamb’s Mark cap and an Awebound tee"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="aw-small">Richard · Founder</figcaption>
            </figure>
          </Reveal>
          <div className="about-split-body">
            <div className="founder-note">
              <p className="aw-body">
                I’m Richard, a Florida native and a Christian. My faith in God comes first. Living
                for Christ is my sole purpose and priority in life.
              </p>
              <p className="aw-body">
                Creating Awebound is just one branch of that. My hope is that God uses it to start
                conversations about Him wherever these clothes are bought and worn.
              </p>
            </div>
            <p className="aw-body">
              Awebound is for believers who aren’t ashamed of the gospel and want to wear their
              faith openly. Every piece begins in Scripture and tells part of the story of Jesus
              Christ, our Lord and Savior.
            </p>
            <p className="aw-body">
              When someone asks what a design means, the person wearing it gets to answer. That’s
              the conversation we hope every piece starts. We plant the seed, and God makes it grow.
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
              Awe is what you feel when you catch a glimpse of who God is. To be bound in awe is to
              stay there, and to let reverence for Jesus Christ shape what you make, what you wear
              and how you live.
            </p>
            <p className="aw-body">
              Worn without shame is the other half. Paul wrote that he wasn’t ashamed of the gospel,
              because it is the power of God. Awebound is made for people who feel the same way.
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
              Each part does its own job. Together they make something worth wearing, and worth
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
            <p className="aw-body">Every piece, in every release, is made the same way.</p>
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
