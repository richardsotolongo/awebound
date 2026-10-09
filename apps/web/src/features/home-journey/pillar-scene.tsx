"use client";

import { Button, ScriptureRef } from "@awebound/brand";
import type { CollectionSlug } from "@/shared";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ComponentType } from "react";
import type { Pillar } from "@/lib/site";
import { ArchScene, ChainScene, TombScene, type SceneProps } from "./scenes";

const ART: Record<CollectionSlug, ComponentType<SceneProps>> = {
  "royal-heritage": ArchScene,
  "broken-bond": ChainScene,
  "rolled-away": TombScene,
};

const NUMERALS = ["I", "II", "III"];

/**
 * One pillar of the story. The section is tall; its inner panel stays pinned while the visitor
 * scrolls, and that scroll position drives the scene. With reduced motion the panel isn't pinned
 * (see journey.css) and the scene shows its finished state.
 */
export function PillarScene({ pillar, index }: { pillar: Pillar; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const finished = useMotionValue(1);
  const progress = reduce ? finished : scrollYProgress;

  const textOpacity = useTransform(progress, [0.38, 0.58], [0, 1], { clamp: true });
  const textY = useTransform(progress, [0.38, 0.58], [16, 0], { clamp: true });
  const meter = useTransform(progress, [0, 1], [0, 1], { clamp: true });
  const Art = ART[pillar.slug];
  const headingId = `pillar-${pillar.slug}`;

  return (
    <section ref={ref} className="pillar" data-flip={index % 2 === 1} aria-labelledby={headingId}>
      <div className="pillar-sticky">
        <div className="pillar-art">
          <Art progress={progress} />
        </div>
        <motion.div className="pillar-text" style={{ opacity: textOpacity, y: textY }}>
          <p className="aw-label">
            {NUMERALS[index]} · {pillar.pillar}
          </p>
          <h2 id={headingId} className="aw-h1">
            {pillar.family}
          </h2>
          <p className="aw-body">{pillar.story}</p>
          <ScriptureRef reference={pillar.scripture} align="start" />
          <Button variant="secondary" href={`/collections/${pillar.slug}`}>
            Shop {pillar.family}
          </Button>
        </motion.div>
        <div className="pillar-meter" aria-hidden="true">
          <motion.span style={{ scaleY: meter }} />
        </div>
      </div>
    </section>
  );
}
