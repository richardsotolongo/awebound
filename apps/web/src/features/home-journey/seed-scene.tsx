"use client";

import { Button, ScriptureRef, Wordmark } from "@awebound/brand";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * Why the brand exists, on bone paper: the clothes are the seed, the conversation is the
 * planting, and the growth is God's. A seed falls, roots, and rises into a head of wheat as the
 * section scrolls through view.
 */
export function SeedScene() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const done = useMotionValue(0.85);
  const p = reduce ? done : scrollYProgress;

  const seedY = useTransform(p, [0.12, 0.36], [40, 352], { clamp: true });
  const seedOpacity = useTransform(p, [0.12, 0.18, 0.4, 0.46], [0, 1, 1, 0], { clamp: true });
  const ground = useTransform(p, [0.08, 0.3], [0, 1], { clamp: true });
  const roots = useTransform(p, [0.38, 0.52], [0, 1], { clamp: true });
  const stem = useTransform(p, [0.42, 0.64], [0, 1], { clamp: true });
  const leaves = useTransform(p, [0.52, 0.68], [0, 1], { clamp: true });
  const ear = useTransform(p, [0.6, 0.74], [0, 1], { clamp: true });
  const earScale = useTransform(p, [0.6, 0.74], [0.6, 1], { clamp: true });
  const rays = useTransform(p, [0.62, 0.8], [0, 1], { clamp: true });

  return (
    <section ref={ref} className="seed" data-theme="light" aria-labelledby="seed-title">
      <div className="aw-container seed-grid">
        <svg viewBox="0 0 480 520" className="seed-art" aria-hidden="true" focusable="false">
          {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
            <motion.path
              key={k}
              className="seed-ray"
              d={`M240 -10 L${240 + k * 70} 330`}
              style={{ pathLength: rays }}
            />
          ))}
          <motion.path
            className="seed-line"
            d="M20 380 C120 372 360 372 460 380"
            style={{ pathLength: ground }}
          />
          {[60, 110, 160, 320, 370, 420].map((x) => (
            <motion.path
              key={x}
              className="seed-fine"
              d={`M${x} 392 l18 10`}
              style={{ pathLength: ground }}
            />
          ))}
          <motion.ellipse
            cx="240"
            rx="7"
            ry="10"
            className="seed-seed"
            cy={seedY}
            style={{ opacity: seedOpacity }}
          />
          <motion.path
            className="seed-fine"
            d="M240 382 C236 410 226 428 210 446 M240 382 C244 414 256 432 274 452 M240 384 V440"
            style={{ pathLength: roots }}
          />
          <motion.path
            className="seed-line"
            d="M240 380 C238 320 244 250 240 170"
            style={{ pathLength: stem }}
          />
          <motion.path
            className="seed-line"
            d="M240 300 C210 290 186 268 176 236 C206 244 230 266 240 300 M241 262 C268 252 290 230 298 200 C270 210 248 232 241 262"
            style={{ pathLength: leaves }}
          />
          <motion.g style={{ opacity: ear, scale: earScale, originX: "240px", originY: "170px" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <ellipse
                  className="seed-grain"
                  cx={231}
                  cy={164 - i * 18}
                  rx="7"
                  ry="13"
                  transform={`rotate(-26 231 ${164 - i * 18})`}
                />
                <ellipse
                  className="seed-grain"
                  cx={249}
                  cy={164 - i * 18}
                  rx="7"
                  ry="13"
                  transform={`rotate(26 249 ${164 - i * 18})`}
                />
              </g>
            ))}
            <ellipse className="seed-grain" cx="240" cy="78" rx="6" ry="13" />
          </motion.g>
        </svg>

        <div className="seed-text">
          <Wordmark height={64} title="Awebound" className="seed-mark" />
          <p className="aw-label">Why we make it</p>
          <h2 id="seed-title" className="aw-h1">
            Worn to be asked
          </h2>
          <p className="aw-body">
            A shirt can’t preach, and it isn’t meant to. It’s meant to be noticed, so someone asks
            what it means.
          </p>
          <p className="aw-body">
            When they do, you get to answer with Jesus Christ. That answer is the seed. What grows
            from it is God’s work.
          </p>
          <figure className="seed-quote">
            <blockquote>I have planted, Apollos watered; but God gave the increase.</blockquote>
            <figcaption>
              <ScriptureRef reference="1 Corinthians 3:6" translation="KJV" align="start" />
            </figcaption>
          </figure>
          <div className="aw-btn-row">
            <Button variant="secondary" href="/about">
              Read our story
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
