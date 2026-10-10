"use client";

import { Button, ScriptureQuote } from "@awebound/brand";
import type { ProductSummary, ProductStory } from "@/shared";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

interface DesignStoryProps {
  product: ProductSummary;
  story: Pick<ProductStory, "theme" | "call" | "art" | "meaning">;
  /** The piece in its stone niche: the niche, and the garment with its shadow, as two layers. */
  scene: { niche: string; piece: string; alt: string };
  flip?: boolean;
}

/**
 * One featured piece: the garment hanging in a pointed stone niche in its own color, the moment
 * in Scripture behind it, and what the design does with it. Only the garment moves, drifting a
 * little against the niche as the section scrolls by; the words, verse and button are readable
 * the whole time.
 */
export function DesignStory({ product, story, scene, flip }: DesignStoryProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["2.5%", "-2.5%"]);
  const id = `story-${product.slug}`;

  return (
    <article ref={ref} className="story" data-flip={flip} aria-labelledby={id}>
      <div className="story-art">
        <div className="story-plate">
          {/* eslint-disable-next-line @next/next/no-img-element -- layered scene, sized by CSS */}
          <img src={scene.niche} alt="" loading="lazy" decoding="async" />
          <motion.img
            src={scene.piece}
            alt={scene.alt}
            loading="lazy"
            decoding="async"
            style={{ y }}
          />
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
