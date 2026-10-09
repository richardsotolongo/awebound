"use client";

import { Button, ScriptureRef, ThornCross } from "@awebound/brand";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * The first screen: a column of light descends and reveals the Thorn Cross from the top down,
 * then the words rise in. Kept short (about a second) so nobody waits. It carries the page's
 * one oxblood glow and its one primary button.
 */
export function Opening() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.28, delay, ease: EASE },
        };

  return (
    <section className="journey-opening aw-grain" aria-labelledby="opening-title">
      <motion.div
        className="journey-shaft"
        aria-hidden="true"
        initial={reduce ? false : { scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0, ease: EASE }}
      />
      <div className="journey-inner">
        <motion.div
          className="journey-cross"
          initial={reduce ? false : { clipPath: "inset(0% 0% 100% 0%)", opacity: 0.4 }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.12, ease: EASE }}
        >
          <ThornCross height={220} title="" />
        </motion.div>
        <motion.p className="aw-label" {...rise(0.55)}>
          Christian apparel
        </motion.p>
        <motion.h1 id="opening-title" className="aw-display" {...rise(0.62)}>
          Bound in awe. Worn without shame.
        </motion.h1>
        <motion.p className="journey-lede" {...rise(0.7)}>
          It was never about looking the part. Every piece is made to be asked about, so you can
          answer with Jesus Christ and plant a seed.
        </motion.p>
        <motion.div className="aw-btn-row" style={{ justifyContent: "center" }} {...rise(0.78)}>
          <Button variant="primary" href="/shop">
            Shop the release
          </Button>
          <Button variant="secondary" href="/about">
            Our story
          </Button>
        </motion.div>
        <motion.div {...rise(0.86)}>
          <ScriptureRef reference="Romans 1:16" />
        </motion.div>
      </div>
      <motion.a
        href="#behold"
        className="journey-cue"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 1.1 }}
      >
        <span className="aw-label">Scroll</span>
        <span className="journey-cue-line" aria-hidden="true" />
      </motion.a>
    </section>
  );
}
