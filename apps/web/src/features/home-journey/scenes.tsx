"use client";

import { LILY, THORN_CROSS } from "@awebound/brand";
import { motion, useTransform, type MotionValue } from "motion/react";
import { MarkPath } from "./mark-path";

/**
 * The three pillar scenes, drawn as engraved line art and driven by scroll progress (0 → 1).
 * Motion is slow and continuous: lines draw, chains part, a stone rolls. No shaking, flames or
 * embers. The Thorn Cross only ever appears upright and whole.
 */
export interface SceneProps {
  progress: MotionValue<number>;
}

/** pathLength from 0 to 1 across [start, end] of the scene's progress. */
function useDraw(progress: MotionValue<number>, start: number, end: number) {
  return useTransform(progress, [start, end], [0, 1], { clamp: true });
}

function useFade(progress: MotionValue<number>, start: number, end: number, to = 1) {
  return useTransform(progress, [start, end], [0, to], { clamp: true });
}

/* ───────────────────────── Royal heritage: an arch draws itself upward ───────────────────────── */

const HATCH_LINES = Array.from({ length: 30 }, (_, i) => {
  const x = 100 + i * 14;
  return `M${x} 40 L${x - 150} 190`;
});

export function ArchScene({ progress }: SceneProps) {
  const steps = useDraw(progress, 0, 0.15);
  const columns = useDraw(progress, 0.05, 0.35);
  const flutes = useDraw(progress, 0.15, 0.4);
  const arch = useDraw(progress, 0.3, 0.6);
  const frame = useDraw(progress, 0.4, 0.62);
  const hatch = useFade(progress, 0.5, 0.68, 0.55);
  const glow = useFade(progress, 0.6, 0.82);
  const cross = useFade(progress, 0.66, 0.84);
  const crossY = useTransform(progress, [0.66, 0.84], [10, 0], { clamp: true });
  const rays = useDraw(progress, 0.7, 0.92);

  return (
    <svg viewBox="0 0 600 640" className="scene" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="arch-light" cx="50%" cy="10%" r="75%">
          <stop offset="0" className="sc-stop-light" />
          <stop offset="1" className="sc-stop-none" />
        </radialGradient>
        <clipPath id="arch-spandrel">
          <path d="M130 248 V40 H470 V248 H455 C455 150 375 96 300 72 C225 96 145 150 145 248 Z" />
        </clipPath>
        <clipPath id="arch-opening">
          <path d="M200 560 V260 C200 182 252 140 300 122 C348 140 400 182 400 260 V560 Z" />
        </clipPath>
      </defs>

      {/* light inside the arch */}
      <motion.rect
        x="200"
        y="110"
        width="200"
        height="450"
        fill="url(#arch-light)"
        clipPath="url(#arch-opening)"
        style={{ opacity: glow }}
      />
      <g clipPath="url(#arch-opening)">
        {[-36, -24, -12, 0, 12, 24, 36].map((a) => (
          <motion.path
            key={a}
            className="sc-ray"
            d={`M300 118 L${(300 + Math.tan((a * Math.PI) / 180) * 440).toFixed(1)} 560`}
            style={{ pathLength: rays }}
          />
        ))}
      </g>

      {/* steps */}
      {["M90 560 H510", "M70 580 H530", "M50 600 H550"].map((d) => (
        <motion.path key={d} className="sc-line" d={d} style={{ pathLength: steps }} />
      ))}

      {/* columns: shaft, base, capital */}
      {[150, 400].map((x) => (
        <g key={x}>
          <motion.path
            className="sc-line"
            d={`M${x} 560 V260 M${x + 50} 260 V560`}
            style={{ pathLength: columns }}
          />
          <motion.path
            className="sc-line"
            d={`M${x - 10} 560 H${x + 60} M${x - 6} 548 H${x + 56} M${x - 10} 260 H${x + 60} M${x - 5} 248 H${x + 55}`}
            style={{ pathLength: columns }}
          />
          <motion.path
            className="sc-fine"
            d={`M${x + 13} 272 V536 M${x + 25} 272 V536 M${x + 37} 272 V536`}
            style={{ pathLength: flutes }}
          />
        </g>
      ))}

      {/* pointed arch, outer and inner, and keystone */}
      <motion.path
        className="sc-line sc-strong"
        d="M145 248 C145 150 225 96 300 72 C375 96 455 150 455 248"
        style={{ pathLength: arch }}
      />
      <motion.path
        className="sc-line"
        d="M200 260 C200 182 252 140 300 122 C348 140 400 182 400 260"
        style={{ pathLength: arch }}
      />
      <motion.path className="sc-line" d="M286 70 L300 48 L314 70" style={{ pathLength: arch }} />

      {/* frame and engraved hatching in the spandrels */}
      <motion.path className="sc-line" d="M130 248 V40 H470 V248" style={{ pathLength: frame }} />
      <motion.g clipPath="url(#arch-spandrel)" style={{ opacity: hatch }}>
        {HATCH_LINES.map((d) => (
          <path key={d} className="sc-fine" d={d} />
        ))}
      </motion.g>

      {/* the Thorn Cross, lit from above */}
      <motion.g style={{ opacity: cross, y: crossY }}>
        <MarkPath geometry={THORN_CROSS} cx={300} cy={300} height={150} className="sc-mark" />
      </motion.g>
    </svg>
  );
}

/* ───────────────────────── Freedom: the chain's center link opens ───────────────────────── */

const LINK_X = (i: number) => 320 + (i - 3) * 64;

function FaceLink({ cx, draw }: { cx: number; draw: MotionValue<number> }) {
  return (
    <>
      <motion.path
        className="sc-chain"
        d={`M${cx - 40} 200 a40 22 0 1 0 80 0 a40 22 0 1 0 -80 0`}
        style={{ pathLength: draw }}
      />
      <motion.path
        className="sc-fine"
        d={`M${cx - 26} 200 a26 9 0 1 0 52 0 a26 9 0 1 0 -52 0`}
        style={{ pathLength: draw }}
      />
      <motion.path
        className="sc-hi"
        d={`M${cx - 30} 186 q30 -10 60 0`}
        style={{ pathLength: draw }}
      />
    </>
  );
}

function EdgeLink({ cx, draw }: { cx: number; draw: MotionValue<number> }) {
  return (
    <>
      <motion.path
        className="sc-chain"
        d={`M${cx - 42} 194 h84 a6 6 0 0 1 0 12 h-84 a6 6 0 0 1 0 -12 z`}
        style={{ pathLength: draw }}
      />
      <motion.path className="sc-fine" d={`M${cx - 36} 200 h72`} style={{ pathLength: draw }} />
    </>
  );
}

export function ChainScene({ progress }: SceneProps) {
  const draw = useDraw(progress, 0, 0.3);
  const leftX = useTransform(progress, [0.3, 0.72], [0, -64], { clamp: true });
  const rightX = useTransform(progress, [0.3, 0.72], [0, 64], { clamp: true });
  const drop = useTransform(progress, [0.3, 0.72], [0, 22], { clamp: true });
  const leftTilt = useTransform(progress, [0.3, 0.72], [0, -7], { clamp: true });
  const rightTilt = useTransform(progress, [0.3, 0.72], [0, 7], { clamp: true });
  const halfOpen = useTransform(progress, [0.3, 0.6], [0, 28], { clamp: true });
  const halfOpenNeg = useTransform(halfOpen, (v) => -v);
  const light = useFade(progress, 0.42, 0.78);
  const cross = useFade(progress, 0.6, 0.84);
  const crossY = useTransform(progress, [0.6, 0.84], [12, 0], { clamp: true });

  return (
    <svg viewBox="0 70 640 260" className="scene scene-chain" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="chain-light" cx="50%" cy="50%" r="50%">
          <stop offset="0" className="sc-stop-light" />
          <stop offset="1" className="sc-stop-none" />
        </radialGradient>
      </defs>

      <motion.ellipse
        cx="320"
        cy="200"
        rx="150"
        ry="170"
        fill="url(#chain-light)"
        style={{ opacity: light }}
      />
      <motion.path className="sc-ray" d="M320 70 V138" style={{ pathLength: light }} />

      <motion.g style={{ x: leftX, y: drop, rotate: leftTilt }}>
        {[0, 1, 2].map((i) =>
          i % 2 === 1 ? (
            <FaceLink key={i} cx={LINK_X(i)} draw={draw} />
          ) : (
            <EdgeLink key={i} cx={LINK_X(i)} draw={draw} />
          ),
        )}
        {/* left half of the broken link swings open from its lower end */}
        <motion.path
          className="sc-chain"
          d="M318 178 A40 22 0 0 0 318 222"
          style={{ pathLength: draw, rotate: halfOpenNeg, originX: 1, originY: 1 }}
        />
      </motion.g>

      <motion.g style={{ x: rightX, y: drop, rotate: rightTilt }}>
        {[4, 5, 6].map((i) =>
          i % 2 === 1 ? (
            <FaceLink key={i} cx={LINK_X(i)} draw={draw} />
          ) : (
            <EdgeLink key={i} cx={LINK_X(i)} draw={draw} />
          ),
        )}
        <motion.path
          className="sc-chain"
          d="M322 178 A40 22 0 0 1 322 222"
          style={{ pathLength: draw, rotate: halfOpen, originX: 0, originY: 1 }}
        />
      </motion.g>

      <motion.g style={{ opacity: cross, y: crossY }}>
        <MarkPath geometry={THORN_CROSS} cx={320} cy={196} height={124} className="sc-mark" />
      </motion.g>
    </svg>
  );
}

/* ───────────────────────── Resurrection: the stone rolls away at dawn ───────────────────────── */

const SUN_RAYS = Array.from({ length: 13 }, (_, i) => {
  const angle = Math.PI + (i + 1) * (Math.PI / 14);
  const r1 = 46;
  const r2 = i % 2 === 0 ? 150 : 112;
  const cx = 330;
  const cy = 150;
  return `M${(cx + Math.cos(angle) * r1).toFixed(1)} ${(cy + Math.sin(angle) * r1).toFixed(1)} L${(cx + Math.cos(angle) * r2).toFixed(1)} ${(cy + Math.sin(angle) * r2).toFixed(1)}`;
});

const ROCK_TEXTURE = [
  "M110 330 q20 -18 44 -20",
  "M150 286 q24 -16 50 -14",
  "M196 248 q20 -10 44 -8",
  "M440 236 q26 4 46 18",
  "M486 280 q22 10 36 28",
  "M520 330 q16 14 24 30",
  "M232 300 q10 -6 22 -4",
  "M428 300 q12 2 20 10",
];

export function TombScene({ progress }: SceneProps) {
  const hill = useDraw(progress, 0, 0.22);
  const texture = useDraw(progress, 0.1, 0.3);
  const stoneX = useTransform(progress, [0.26, 0.7], [0, 176], { clamp: true });
  const stoneRotate = useTransform(stoneX, (x) => (x / 82) * (180 / Math.PI));
  const doorLight = useFade(progress, 0.32, 0.74);
  const spill = useFade(progress, 0.45, 0.8, 0.9);
  const sun = useDraw(progress, 0.55, 0.8);
  const rays = useDraw(progress, 0.62, 0.9);
  const lilies = useFade(progress, 0.74, 0.92);
  const liliesY = useTransform(progress, [0.74, 0.92], [8, 0], { clamp: true });

  return (
    <svg viewBox="0 0 640 440" className="scene" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tomb-door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="sc-stop-gold" />
          <stop offset="1" className="sc-stop-bone" />
        </linearGradient>
        <radialGradient id="tomb-spill" cx="50%" cy="0%" r="70%">
          <stop offset="0" className="sc-stop-light" />
          <stop offset="1" className="sc-stop-none" />
        </radialGradient>
      </defs>

      {/* dawn behind the hill */}
      <motion.path
        className="sc-sun"
        d="M290 150 A40 40 0 0 1 370 150"
        style={{ pathLength: sun }}
      />
      {SUN_RAYS.map((d) => (
        <motion.path key={d} className="sc-ray" d={d} style={{ pathLength: rays }} />
      ))}

      {/* the hillside and the open doorway */}
      <motion.path
        className="sc-line sc-strong"
        d="M40 382 C90 300 150 236 230 204 C280 184 380 180 440 204 C520 236 580 300 610 382"
        style={{ pathLength: hill }}
      />
      {ROCK_TEXTURE.map((d) => (
        <motion.path key={d} className="sc-fine" d={d} style={{ pathLength: texture }} />
      ))}
      <path
        className="sc-door"
        d="M270 382 V270 C270 232 300 214 330 214 C360 214 390 232 390 270 V382 Z"
      />
      <motion.path
        d="M276 382 V272 C276 238 302 220 330 220 C358 220 384 238 384 272 V382 Z"
        fill="url(#tomb-door)"
        style={{ opacity: doorLight }}
      />
      <motion.path
        className="sc-line"
        d="M270 382 V270 C270 232 300 214 330 214 C360 214 390 232 390 270 V382"
        style={{ pathLength: hill }}
      />
      <motion.ellipse
        cx="330"
        cy="392"
        rx="150"
        ry="26"
        fill="url(#tomb-spill)"
        style={{ opacity: spill }}
      />
      <motion.path className="sc-line" d="M20 384 H620" style={{ pathLength: hill }} />

      {/* the stone, rolled aside */}
      <motion.g style={{ x: stoneX, rotate: stoneRotate }}>
        <circle cx="330" cy="300" r="82" className="sc-stone" />
        <circle cx="330" cy="300" r="64" className="sc-fine" fill="none" />
        <path
          className="sc-fine"
          d="M282 262 q14 -10 30 -12 M354 340 q16 -6 26 -18 M300 330 q-8 -10 -10 -22 M346 258 q14 6 22 18"
        />
      </motion.g>

      {/* lilies at the threshold */}
      <motion.g style={{ opacity: lilies, y: liliesY }}>
        <MarkPath geometry={LILY} cx={236} cy={350} height={64} className="sc-lily" />
        <MarkPath geometry={LILY} cx={426} cy={350} height={64} className="sc-lily" />
      </motion.g>
    </svg>
  );
}
