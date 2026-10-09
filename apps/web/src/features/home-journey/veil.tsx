"use client";

import { ScriptureRef } from "@awebound/brand";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";
import { RELEASE, VISIONS } from "@/lib/release";

/**
 * The release title. A dark curtain hangs over the word BEHOLD; as the visitor scrolls it tears
 * from top to bottom (Matthew 27:51) and parts, and light comes through behind the word.
 * Reduced motion skips the curtain and shows the open state.
 */

const SAMPLES = 32;
/** A fixed, irregular seam so the tear looks torn rather than cut. Percent offsets from 50%. */
const SEAM = Array.from({ length: SAMPLES + 1 }, (_, i) => {
  const jag = (((i * 37) % 11) - 5) * 0.32;
  const drift = Math.sin(i * 0.55) * 1.1;
  return 50 + jag + drift;
});

function seamPolygon(side: "left" | "right", tearY: number, spread: number): string {
  const edge = side === "left" ? "0%" : "100%";
  const points = [`${edge} 0%`];
  for (let i = 0; i <= SAMPLES; i++) {
    const y = (i / SAMPLES) * 100;
    const open = Math.max(0, tearY - y) * spread;
    const x = (SEAM[i] ?? 50) + (side === "left" ? -open : open);
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  points.push(`${edge} 100%`);
  return `polygon(${points.join(", ")})`;
}

function Curtain({ progress, side }: { progress: MotionValue<number>; side: "left" | "right" }) {
  const tearY = useTransform(progress, [0.04, 0.42], [-4, 104], { clamp: true });
  const clipPath = useTransform(tearY, (y) => seamPolygon(side, y, 0.2));
  const x = useTransform(progress, [0.36, 0.8], ["0%", side === "left" ? "-64%" : "64%"], {
    clamp: true,
  });
  return (
    <motion.div className="veil-half" data-side={side} style={{ x }} aria-hidden="true">
      <motion.div className="veil-cloth" style={{ clipPath }}>
        <span className="veil-words">Come and see</span>
      </motion.div>
    </motion.div>
  );
}

export function BeholdReveal() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const done = useMotionValue(1);
  const progress = reduce ? done : scrollYProgress;

  const light = useTransform(progress, [0.02, 0.55], [0.15, 1], { clamp: true });
  const tracking = useTransform(progress, [0.18, 0.72], ["0.16em", "0.06em"], { clamp: true });
  const sweep = useTransform(progress, [0.25, 0.9], ["120% 0", "-20% 0"], { clamp: true });
  const wordOpacity = useTransform(progress, [0.08, 0.4], [0.35, 1], { clamp: true });
  const detail = useTransform(progress, [0.6, 0.8], [0, 1], { clamp: true });
  const detailY = useTransform(progress, [0.6, 0.8], [14, 0], { clamp: true });
  const veilOpacity = useTransform(progress, [0.72, 0.86], [1, 0], { clamp: true });

  return (
    <section ref={ref} id="behold" className="veil" aria-labelledby="behold-title">
      <div className="veil-sticky">
        <motion.div className="veil-light" style={{ opacity: light }} aria-hidden="true" />
        <div className="veil-content">
          <p className="aw-label">Release {RELEASE.number}</p>
          <motion.h2
            id="behold-title"
            className="veil-word"
            style={{ letterSpacing: tracking, backgroundPosition: sweep, opacity: wordOpacity }}
          >
            {RELEASE.name}
          </motion.h2>
          <motion.div className="veil-detail" style={{ opacity: detail, y: detailY }}>
            <p className="veil-tagline">{RELEASE.tagline}</p>
            <ScriptureRef reference={RELEASE.reference} />
            <ol className="veil-themes" aria-label="The six pieces">
              {VISIONS.map((v) => (
                <li key={v.slug}>
                  <a href={`#vision-${v.slug}`}>
                    <span className="veil-num">{v.numeral}</span> {v.theme}
                  </a>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
        {reduce ? null : (
          <motion.div className="veil-curtain" style={{ opacity: veilOpacity }}>
            <Curtain progress={progress} side="left" />
            <Curtain progress={progress} side="right" />
          </motion.div>
        )}
      </div>
    </section>
  );
}
