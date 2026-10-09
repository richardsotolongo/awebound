import {
  AltarPanel,
  Button,
  Mark,
  ScriptureRef,
  ThornRule,
  type SecondaryMarkName,
} from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { PILLARS } from "@/lib/site";

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
    body: "A shirt is a quiet way to say something out loud. Our pieces carry a symbol and a single reference, so when someone asks what it means, you get to tell them about Jesus Christ.",
  },
  {
    title: "Every design tells a story",
    body: "Chains broken. A stone rolled away. A throne of grace. Each design holds one moment from Scripture, engraved and set with its reference so the story can be looked up and read.",
  },
];

const PILLAR_MARKS: Record<string, SecondaryMarkName> = {
  "royal-heritage": "thorn-wreath",
  "broken-bond": "thorn-vine",
  "rolled-away": "lily",
};

const COMMITMENTS = [
  "Symbols only. Out of reverence, we never depict Jesus, God the Father or the Holy Spirit as a person.",
  "Scripture by full reference on every piece. When we quote a verse, we use the New Living Translation.",
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
                For I am not ashamed of this Good News about Christ.
              </blockquote>
              <figcaption>
                <ScriptureRef reference="Romans 1:16" translation="NLT" />
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="section aw-grain" aria-labelledby="pillars-title">
        <div className="aw-container" style={{ display: "grid", gap: "var(--space-12)" }}>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <p className="aw-label">The pillars</p>
            <h2 id="pillars-title" className="aw-h2">
              Royal heritage. Freedom. Resurrection.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gap: "var(--space-8)",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            {PILLARS.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.06}>
                <article
                  style={{
                    display: "grid",
                    gap: "var(--space-4)",
                    justifyItems: "start",
                    padding: "var(--space-8)",
                    background: "var(--surface-raised)",
                    height: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <span
                    style={{
                      color: "var(--bb-copper)",
                      height: 72,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Mark
                      name={PILLAR_MARKS[p.slug] ?? "lily"}
                      height={p.slug === "broken-bond" ? 28 : 64}
                      title=""
                    />
                  </span>
                  <p className="aw-label">{p.pillar}</p>
                  <h3 className="aw-product-name">{p.family}</h3>
                  <p className="aw-small">{p.story}</p>
                  <ScriptureRef reference={p.scripture} align="start" />
                  <Link href={`/collections/${p.slug}`} className="aw-btn aw-btn-link">
                    Shop {p.family}
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
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
              Shop the collection
            </Button>
            <Button variant="secondary" href="/contact">
              Write to us
            </Button>
          </div>
          <p className="field-help" style={{ maxWidth: "70ch" }}>
            Scripture quotations marked NLT are taken from the Holy Bible, New Living Translation,
            copyright © 1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale
            House Publishers, Carol Stream, Illinois 60188. All rights reserved.
          </p>
        </div>
      </section>
    </>
  );
}
