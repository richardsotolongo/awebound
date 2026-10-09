"use client";

import { Button, ScriptureRef } from "@awebound/brand";
import { formatPrice, type ProductSummary } from "@/shared";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";
import type { Vision } from "@/lib/release";
import { MOTIFS } from "./motifs";

interface VisionSceneProps {
  vision: Vision;
  /** Live product data (price, name, cut). Missing when the API is down or the piece isn't listed. */
  product?: ProductSummary;
  image: { url: string; alt: string };
  index: number;
}

/** One word of the verse: dim until the scroll reaches it, then lit. */
function Word({
  progress,
  range,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  children: string;
}) {
  const opacity = useTransform(progress, range, [0.18, 1], { clamp: true });
  return <motion.span style={{ opacity }}>{children} </motion.span>;
}

/**
 * One piece of the release, told as a pinned scene: the art is lit from above as the visitor
 * scrolls, its line art draws behind it, and the verse lights word by word. Reduced motion shows
 * the finished scene without pinning.
 */
export function VisionScene({ vision, product, image, index }: VisionSceneProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  // 0 → 0.33 is the scene sliding into view; the pinned part runs from 0.33 to 1.
  const done = useMotionValue(1);
  const enter = reduce ? done : scrollYProgress;
  const progress = useTransform(enter, [0.3, 0.95], [0, 1], { clamp: true });

  // Light from above: a small pool at the top grows into a soft oval that fades the photo's edges.
  const rx = useTransform(progress, [0, 0.4], [14, 56], { clamp: true });
  const ry = useTransform(progress, [0, 0.4], [10, 60], { clamp: true });
  const cy = useTransform(progress, [0, 0.4], [6, 46], { clamp: true });
  const mask = useMotionTemplate`radial-gradient(ellipse ${rx}% ${ry}% at 50% ${cy}%, var(--ink) 52%, transparent 100%)`;
  const lit = useTransform(progress, [0, 0.45], [0.35, 1], { clamp: true });
  const filter = useMotionTemplate`brightness(${lit})`;
  const scale = useTransform(progress, [0, 0.6], [1.1, 1], { clamp: true });
  const numeralY = useTransform(enter, [0, 1], ["18%", "-12%"]);
  const head = useTransform(progress, [0.08, 0.28], [0, 1], { clamp: true });
  const headY = useTransform(progress, [0.08, 0.28], [18, 0], { clamp: true });
  const buy = useTransform(progress, [0.66, 0.82], [0, 1], { clamp: true });
  const buyY = useTransform(progress, [0.66, 0.82], [12, 0], { clamp: true });

  const words = vision.verse.split(/\s+/);
  const span = 0.36 / words.length;
  const Motif = MOTIFS[vision.motif];
  const headingId = `vision-${vision.slug}-title`;
  const href = `/shop/${vision.slug}`;

  return (
    <section
      ref={ref}
      id={`vision-${vision.slug}`}
      className="vision"
      data-flip={index % 2 === 1}
      data-index={index}
      aria-labelledby={headingId}
    >
      <div className="vision-sticky">
        <motion.span className="vision-numeral" style={{ y: numeralY }} aria-hidden="true">
          {vision.numeral}
        </motion.span>

        <div className="vision-art">
          <div className="vision-plate">
            <Motif progress={progress} />
            <motion.figure
              className="vision-frame"
              style={{ WebkitMaskImage: mask, maskImage: mask, filter, scale }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN */}
              <img
                src={image.url}
                alt={image.alt}
                loading={index < 1 ? "eager" : "lazy"}
                decoding="async"
              />
            </motion.figure>
          </div>
        </div>

        <div className="vision-text">
          <motion.div className="vision-head" style={{ opacity: head, y: headY }}>
            <p className="aw-label">
              {vision.numeral} · {vision.theme}
            </p>
            <h2 id={headingId} className="vision-call">
              {vision.call}
            </h2>
          </motion.div>
          <blockquote className="vision-verse">
            <p>
              {words.map((w, i) => (
                <Word
                  key={`${w}-${i}`}
                  progress={progress}
                  range={[0.24 + i * span, 0.24 + (i + 1) * span]}
                >
                  {w}
                </Word>
              ))}
            </p>
            <footer>
              <ScriptureRef reference={vision.reference} translation="KJV" align="start" />
            </footer>
          </blockquote>
          <motion.div className="vision-buy" style={{ opacity: buy, y: buyY }}>
            <div className="vision-piece">
              <p className="aw-product-name">{product?.name ?? vision.theme}</p>
              {product ? (
                <p className="aw-small">
                  {product.category.cut} · {product.baseColor}
                  <span className="aw-meta vision-price">
                    {formatPrice(product.priceCents, product.currency)}
                  </span>
                </p>
              ) : null}
            </div>
            {product ? (
              <Button variant="secondary" href={href}>
                View the piece
              </Button>
            ) : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
