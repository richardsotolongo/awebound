import { AltarPanel, Button, ScriptureQuote, ThornRule } from "@awebound/brand";
import { ReleaseCard } from "@/features/release/release-card";
import { pageMeta } from "@/lib/site";
import { getProduct, withFallback } from "@/server/catalog";
import { TRANSLATION, TRANSLATION_NAME, VERSES } from "@/server/scripture";

export const metadata = pageMeta({
  path: "/about",
  title: "About",
  description:
    "Who started Awebound and why: Christian apparel rooted in Scripture and reverence for Jesus Christ.",
});

/** Richard's story in his own words (supplied October 2026). Change the wording only with him. */
const STORY = [
  "I’m Richard, the founder of Awebound. My faith in God comes first, and my desire to serve Jesus Christ and others is at the heart of why I’m building this brand.",
  "Outside of Awebound, I serve my community in law enforcement and lead a men’s Bible study. Service, fellowship, and time in Scripture matter deeply to me. I want my faith to shape how I treat people, how I work, and what I create.",
  "I believe we are saved by grace through faith in Jesus Christ. My desire to serve Him comes from gratitude for that grace. Awebound is one way I’m putting that desire into practice.",
  "I’m drawn to expressive lettering, oversized fits, and artwork that tells a story. With Awebound, I want to bring that creativity together with biblical meaning—to make clothing people enjoy wearing and give them a reason to look deeper into the Scripture behind each piece.",
  "The stories of Christ’s holiness, mercy, sacrifice, and resurrection deserve thoughtful attention. My aim is to approach them with reverence and create designs that can open the door to honest conversations about Jesus.",
  "Our introductory collection, Behold, is the beginning of that work. I’m building Awebound carefully, with a commitment to meaningful design and respect for the Word that inspires it.",
  "Whether you’re here for the artwork, the meaning behind it, or simply to learn more, you’re welcome here. Thank you for taking the time to be part of this beginning.",
  "Bound in awe. Worn without shame.",
];

export const revalidate = 60;

/** The pieces the “Biblical imagery” line below describes, shown beside it. */
const NAMED = ["still-the-storm", "thorns-to-lilies", "stone-in-motion"];

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
    body: "Clothes go where you go, to class, to work, to the grocery store. That’s where the artwork gets seen, and where a conversation can start.",
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

export default async function AboutPage() {
  const named = (
    await Promise.all(NAMED.map((slug) => withFallback(() => getProduct(slug), null)))
  ).filter((p) => p !== null);
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
        as="h1"
        title="Bound in awe. Worn without shame."
        body="Awebound makes clothing rooted in Scripture and reverence for Jesus Christ."
      />

      <section data-theme="light" className="section about-founder" aria-labelledby="story-title">
        <div className="aw-container about-split">
          <div className="about-split-head">
            <h2 id="story-title" className="aw-h1">
              My story
            </h2>
            <figure className="founder-photo">
              {/* eslint-disable-next-line @next/next/no-img-element -- static portrait with srcset */}
              <img
                src="/about/richard-960.webp"
                srcSet="/about/richard-480.webp 480w, /about/richard-960.webp 960w"
                sizes="(max-width: 899px) min(100vw - 32px, 480px), 480px"
                width={960}
                height={1200}
                alt="Portrait of Richard"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="aw-small">Richard, founder of Awebound</figcaption>
            </figure>
          </div>
          <div className="about-split-body">
            {STORY.map((paragraph) => (
              <p key={paragraph} className="aw-body">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-awe" aria-labelledby="awe-title">
        <div className="aw-container about-split">
          <h2 id="awe-title" className="aw-h1">
            What “bound in awe” means
          </h2>
          <div className="about-split-body">
            <p className="aw-body">
              Awe is what you feel when you catch a glimpse of who God is. To be bound in awe is to
              stay there, and to let reverence for Jesus Christ shape what you make, what you wear
              and how you live.
            </p>
            <p className="aw-body">
              Worn without shame is the other half. Paul wrote that he wasn’t ashamed of the gospel,
              because it is the power of God.
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
        <div className="aw-container about-together-in">
          <div className="about-together-head">
            <h2 id="together-title" className="aw-h1">
              Scripture, art, lettering, clothing
            </h2>
            <p className="aw-body">
              Each part does its own job. Together they make something worth wearing, and worth
              asking about.
            </p>
          </div>
          <ul className="about-together-grid">
            {TOGETHER.map((item) => (
              <li key={item.title}>
                <h3 className="aw-h3">{item.title}</h3>
                <p className="aw-body">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
        {named.length > 0 ? (
          <ul className="wall about-wall" aria-label="Three of the pieces">
            {named.map((p) => (
              <li key={p.slug}>
                <ReleaseCard product={p} tile />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="section design-story" aria-labelledby="design-story-title">
        <div className="aw-container design-story-inner">
          <div className="design-story-head">
            <h2 id="design-story-title" className="aw-h1">
              Every design tells a story
            </h2>
            <p className="aw-body">Every piece, in every release, is made the same way.</p>
          </div>
          <ol className="design-story-steps">
            {DESIGN_STORY.map((step) => (
              <li key={step.title}>
                <span className="design-story-num" aria-hidden="true">
                  {step.numeral}
                </span>
                <h3 className="aw-h3">{step.title}</h3>
                <p className="aw-body">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="reverence-title">
        <div className="aw-container about-close">
          <ThornRule />
          <div className="split split-even">
            <h2 id="reverence-title" className="aw-h1">
              How reverence shapes the work
            </h2>
            <ul className="prose">
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
