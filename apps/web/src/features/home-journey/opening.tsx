"use client";

import { Button, ScriptureRef, ThornCross } from "@awebound/brand";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * The first screen: a column of light descends and reveals the Thorn Cross from the top down,
 * then the words rise in. It carries the page's one oxblood glow and its one primary button.
 */
export function Opening() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, delay, ease: EASE },
        };

  return (
    <section className="journey-opening aw-grain" aria-labelledby="opening-title">
      <motion.div
        className="journey-shaft"
        aria-hidden="true"
        initial={reduce ? false : { scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.1, ease: EASE }}
      />
      <div className="journey-inner">
        <motion.div
          className="journey-cross"
          initial={reduce ? false : { clipPath: "inset(0% 0% 100% 0%)", opacity: 0.4 }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.45, ease: EASE }}
        >
          <ThornCross height={220} title="" />
        </motion.div>
        <motion.p className="aw-label" {...rise(1.5)}>
          Christian apparel
        </motion.p>
        <motion.h1 id="opening-title" className="aw-display" {...rise(1.6)}>
          Bound in awe. Worn without shame.
        </motion.h1>
        <motion.p className="journey-lede" {...rise(1.75)}>
          Engraved art and Scripture on every piece, made to start conversations about Jesus Christ.
        </motion.p>
        <motion.div className="aw-btn-row" style={{ justifyContent: "center" }} {...rise(1.9)}>
          <Button variant="primary" href="/shop">
            Shop the collection
          </Button>
          <Button variant="secondary" href="/about">
            Our story
          </Button>
        </motion.div>
        <motion.div {...rise(2.05)}>
          <ScriptureRef reference="Romans 1:16" />
        </motion.div>
      </div>
      <motion.a
        href="#pillars"
        className="journey-cue"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 2.4 }}
      >
        <span className="aw-label">Scroll</span>
        <span className="journey-cue-line" aria-hidden="true" />
      </motion.a>
    </section>
  );
}
