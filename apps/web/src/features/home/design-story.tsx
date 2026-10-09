"use client";

import { Button, ScriptureQuote } from "@awebound/brand";
import type { ProductSummary, ProductStory } from "@/shared";
import { useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { MOTIFS } from "./motifs";

interface DesignStoryProps {
  product: ProductSummary;
  story: Pick<ProductStory, "theme" | "call" | "motif" | "art" | "meaning">;
  /** The artwork, cropped close. */
  image: { url: string; alt: string };
  flip?: boolean;
}

/**
 * One featured piece: its artwork, the moment in Scripture behind it and what the design does
 * with it. Only the line art around the image moves, drawn as the section scrolls into view;
 * the words, verse and button are readable the whole time.
 */
export function DesignStory({ product, story, image, flip }: DesignStoryProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const done = useMotionValue(1);
  const progress = useTransform(reduce ? done : scrollYProgress, [0.1, 1], [0, 1], {
    clamp: true,
  });
  const Motif = MOTIFS[story.motif];
  const id = `story-${product.slug}`;

  return (
    <article ref={ref} className="story" data-flip={flip} aria-labelledby={id}>
      <div className="story-art">
        <div className="story-plate">
          <Motif progress={progress} />
          {/* eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN */}
          <img src={image.url} alt={image.alt} loading="lazy" decoding="async" />
        </div>
      </div>
      <div className="story-text">
        <p className="aw-label">
          {product.name} · {story.theme}
        </p>
        <h3 id={id} className="aw-h2">
          {story.call}
        </h3>
        <ScriptureQuote
          text={product.scripture.text}
          reference={product.scripture.reference}
          translation={product.scripture.translation}
          excerpt={product.scripture.excerpt}
          size="lg"
        />
        <p className="aw-body">{story.meaning}</p>
        <Button variant="secondary" href={`/shop/${product.slug}`}>
          View {product.name}
        </Button>
      </div>
    </article>
  );
}
