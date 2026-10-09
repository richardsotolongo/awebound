"use client";

import { LILY } from "@awebound/brand";
import { motion, useTransform, type MotionValue } from "motion/react";
import type { ComponentType, ReactNode } from "react";
import type { MotifName } from "@/shared";
import { MarkPath } from "./mark-path";

/**
 * Engraved line art around each piece, driven by scroll progress (0 → 1). Slow, continuous
 * motion only: lines draw, a sea calms, a stone rolls, sand falls. No flames, embers or shake,
 * and no crosses (the Thorn Cross is the only cross, and it isn't drawn here).
 *
 * The SVG box is the photo's box grown by 18% on every side (see .vision-plate), so in these
 * coordinates the photo covers x 79–521, y 99–651 and the art lives in the margin around it.
 */
export interface MotifProps {
  progress: MotionValue<number>;
}

const VIEW = "0 0 600 750";

function useDraw(progress: MotionValue<number>, start: number, end: number) {
  return useTransform(progress, [start, end], [0, 1], { clamp: true });
}

function Svg({ children, name }: { children: ReactNode; name: string }) {
  return (
    <svg viewBox={VIEW} className={`motif motif-${name}`} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/* I · Holiness: rings of light spread over the ground; rays rise from it. */
const RINGS = [150, 210, 270, 330, 390];
const GROUND_RAYS = Array.from({ length: 13 }, (_, i) => {
  const t = (i - 6) / 6;
  return `M${(300 + t * 120).toFixed(1)} 700 L${(300 + t * 330).toFixed(1)} ${(40 + Math.abs(t) * 120).toFixed(1)}`;
});

function Ring({ progress, r, i }: { progress: MotionValue<number>; r: number; i: number }) {
  const draw = useDraw(progress, 0.04 + i * 0.07, 0.3 + i * 0.07);
  return (
    <motion.ellipse
      className={i === 0 ? "mo-line mo-strong" : "mo-line"}
      cx="300"
      cy="700"
      rx={r}
      ry={r * 0.16}
      style={{ pathLength: draw }}
    />
  );
}

function GroundMotif({ progress }: MotifProps) {
  const rays = useDraw(progress, 0.25, 0.7);
  const glow = useTransform(progress, [0.2, 0.6], [0, 1], { clamp: true });
  return (
    <Svg name="ground">
      <defs>
        <radialGradient id="mo-ground-glow" cx="50%" cy="92%" r="60%">
          <stop offset="0" className="mo-stop-light" />
          <stop offset="1" className="mo-stop-none" />
        </radialGradient>
      </defs>
      <motion.rect
        x="-100"
        y="300"
        width="800"
        height="450"
        fill="url(#mo-ground-glow)"
        style={{ opacity: glow }}
      />
      {GROUND_RAYS.map((d) => (
        <motion.path key={d} className="mo-ray" d={d} style={{ pathLength: rays }} />
      ))}
      {RINGS.map((r, i) => (
        <Ring key={r} progress={progress} r={r} i={i} />
      ))}
    </Svg>
  );
}

/* II · Power: a heaving sea goes still as the visitor scrolls. */
const WAVES = [
  { y: 560, amp: 34, freq: 0.019, phase: 0 },
  { y: 610, amp: 40, freq: 0.016, phase: 1.4 },
  { y: 660, amp: 46, freq: 0.013, phase: 2.6 },
  { y: 705, amp: 40, freq: 0.011, phase: 0.8 },
  { y: 740, amp: 30, freq: 0.009, phase: 2.1 },
];

function wavePath(y: number, amp: number, freq: number, phase: number): string {
  let d = "";
  for (let x = -40; x <= 640; x += 14) {
    const v =
      y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.35;
    d += `${d ? " L" : "M"}${x} ${v.toFixed(1)}`;
  }
  return d;
}

function Wave({
  progress,
  wave,
  i,
}: {
  progress: MotionValue<number>;
  wave: (typeof WAVES)[number];
  i: number;
}) {
  const d = useTransform(progress, (p) => {
    const calm = Math.min(1, Math.max(0, (p - 0.12) / 0.55));
    const ease = 1 - (1 - calm) ** 3;
    return wavePath(wave.y, wave.amp * (1 - ease), wave.freq, wave.phase + p * 5);
  });
  const draw = useDraw(progress, 0, 0.16 + i * 0.03);
  return (
    <motion.path
      className={i === 2 ? "mo-line mo-strong" : "mo-line"}
      d={d}
      style={{ pathLength: draw }}
    />
  );
}

function SeaMotif({ progress }: MotifProps) {
  const horizon = useDraw(progress, 0.3, 0.75);
  const light = useTransform(progress, [0.45, 0.85], [0, 1], { clamp: true });
  return (
    <Svg name="sea">
      <defs>
        <radialGradient id="mo-sea-light" cx="50%" cy="70%" r="55%">
          <stop offset="0" className="mo-stop-light" />
          <stop offset="1" className="mo-stop-none" />
        </radialGradient>
      </defs>
      <motion.rect
        x="-100"
        y="250"
        width="800"
        height="500"
        fill="url(#mo-sea-light)"
        style={{ opacity: light }}
      />
      <motion.path className="mo-ray" d="M-40 520 H640" style={{ pathLength: horizon }} />
      {WAVES.map((w, i) => (
        <Wave key={w.y} progress={progress} wave={w} i={i} />
      ))}
    </Svg>
  );
}

/* III · Sacrifice: light falls from above in a fan of rays and a halo closes around. */
const FAN = Array.from({ length: 25 }, (_, i) => {
  const a = ((i - 12) / 12) * 1.05;
  const len = i % 2 === 0 ? 900 : 700;
  return `M300 -60 L${(300 + Math.sin(a) * len).toFixed(1)} ${(-60 + Math.cos(a) * len).toFixed(1)}`;
});

function RaysMotif({ progress }: MotifProps) {
  const fan = useDraw(progress, 0.05, 0.5);
  const halo = useDraw(progress, 0.3, 0.75);
  const inner = useDraw(progress, 0.4, 0.85);
  return (
    <Svg name="rays">
      {FAN.map((d) => (
        <motion.path key={d} className="mo-ray" d={d} style={{ pathLength: fan }} />
      ))}
      <motion.ellipse
        className="mo-line mo-strong"
        cx="300"
        cy="375"
        rx="290"
        ry="350"
        style={{ pathLength: halo, rotate: -90, originX: "300px", originY: "375px" }}
      />
      <motion.ellipse
        className="mo-line"
        cx="300"
        cy="375"
        rx="268"
        ry="328"
        style={{ pathLength: inner, rotate: 90, originX: "300px", originY: "375px" }}
      />
    </Svg>
  );
}

/* IV · Mercy: a ring of thorns draws itself around the piece, then lilies open over it. */
const THORNS = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2;
  const cx = 300 + Math.cos(a) * 282;
  const cy = 375 + Math.sin(a) * 336;
  const out = i % 2 === 0 ? 24 : -18;
  const tx = cx + Math.cos(a + 0.7) * out;
  const ty = cy + Math.sin(a + 0.7) * out;
  return `M${cx.toFixed(1)} ${cy.toFixed(1)} L${tx.toFixed(1)} ${ty.toFixed(1)}`;
});

function BloomMotif({ progress }: MotifProps) {
  const vine = useDraw(progress, 0.05, 0.45);
  const vine2 = useDraw(progress, 0.12, 0.52);
  const spikes = useDraw(progress, 0.35, 0.6);
  const lilies = useTransform(progress, [0.55, 0.8], [0, 1], { clamp: true });
  const lilyY = useTransform(progress, [0.55, 0.8], [10, 0], { clamp: true });
  return (
    <Svg name="bloom">
      <motion.path
        className="mo-line mo-strong"
        d="M300 38 C470 34 586 190 584 376 C582 562 466 712 300 712 C134 712 18 562 16 376 C14 190 130 42 300 38"
        style={{ pathLength: vine }}
      />
      <motion.path
        className="mo-line"
        d="M300 60 C140 58 34 204 38 380 C42 552 150 692 300 690 C450 688 560 548 562 372 C564 200 456 62 300 60"
        style={{ pathLength: vine2 }}
      />
      {THORNS.map((d) => (
        <motion.path key={d} className="mo-line" d={d} style={{ pathLength: spikes }} />
      ))}
      <motion.g style={{ opacity: lilies, y: lilyY }}>
        <MarkPath geometry={LILY} cx={300} cy={34} height={84} className="mo-mark" />
        <MarkPath geometry={LILY} cx={34} cy={420} height={64} className="mo-mark" />
        <MarkPath geometry={LILY} cx={566} cy={420} height={64} className="mo-mark" />
      </motion.g>
    </Svg>
  );
}

/* V · Resurrection: an open doorway frames the piece; the stone rolls out of it and away. */
function StoneMotif({ progress }: MotifProps) {
  const ground = useDraw(progress, 0, 0.25);
  const door = useDraw(progress, 0.05, 0.4);
  const x = useTransform(progress, [0.15, 0.55], [0, -330], { clamp: true });
  const rotate = useTransform(x, (v) => (v / 120) * (180 / Math.PI));
  const light = useTransform(progress, [0.35, 0.8], [0, 1], { clamp: true });
  return (
    <Svg name="stone">
      <defs>
        <radialGradient id="mo-door" cx="50%" cy="20%" r="80%">
          <stop offset="0" className="mo-stop-light" />
          <stop offset="1" className="mo-stop-none" />
        </radialGradient>
      </defs>
      <motion.path
        d="M30 712 V300 C30 150 150 40 300 40 C450 40 570 150 570 300 V712 Z"
        fill="url(#mo-door)"
        style={{ opacity: light }}
      />
      <motion.path
        className="mo-line mo-strong"
        d="M30 712 V300 C30 150 150 40 300 40 C450 40 570 150 570 300 V712"
        style={{ pathLength: door }}
      />
      <motion.path
        className="mo-line"
        d="M56 712 V306 C56 170 166 66 300 66 C434 66 544 170 544 306 V712"
        style={{ pathLength: door }}
      />
      <motion.path className="mo-line" d="M-40 714 H640" style={{ pathLength: ground }} />
      <motion.g style={{ x, rotate, originX: "300px", originY: "594px" }}>
        <circle cx="300" cy="594" r="120" className="mo-stone" />
        <circle cx="300" cy="594" r="96" className="mo-line" />
        <path
          className="mo-line"
          d="M246 548 q18 -13 38 -14 M340 650 q20 -8 32 -24 M270 640 q-10 -13 -11 -27 M332 538 q18 8 27 22"
        />
      </motion.g>
    </Svg>
  );
}

/* VI · Life: an hourglass holds the piece; sand drains above it and gathers below, where
   stalks of wheat rise. */
function HourglassMotif({ progress }: MotifProps) {
  const glass = useDraw(progress, 0, 0.3);
  const t = useTransform(progress, [0.15, 0.7], [0, 1], { clamp: true });
  const topY = useTransform(t, (v) => 30 + v * 70);
  const pileH = useTransform(t, (v) => v * 60);
  const pileY = useTransform(pileH, (h) => 720 - h);
  const stalk = useDraw(progress, 0.62, 0.86);
  const ear = useTransform(progress, [0.78, 0.95], [0, 1], { clamp: true });
  return (
    <Svg name="hourglass">
      <defs>
        <clipPath id="mo-glass-top">
          <path d="M60 30 H540 C540 200 360 300 306 375 H294 C240 300 60 200 60 30 Z" />
        </clipPath>
        <clipPath id="mo-glass-bottom">
          <path d="M294 375 H306 C360 450 540 550 540 720 H60 C60 550 240 450 294 375 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#mo-glass-top)">
        <motion.rect x="40" y={topY} width="520" height="110" className="mo-sand" />
      </g>
      <g clipPath="url(#mo-glass-bottom)">
        <motion.rect x="40" y={pileY} width="520" height={pileH} className="mo-sand" />
      </g>
      <motion.path
        className="mo-line mo-strong"
        d="M30 22 H570 M30 728 H570 M60 30 C60 200 240 300 294 375 C240 450 60 550 60 720 M540 30 C540 200 360 300 306 375 C360 450 540 550 540 720"
        style={{ pathLength: glass }}
      />
      <motion.path className="mo-line" d="M44 22 V728 M556 22 V728" style={{ pathLength: glass }} />
      {[-1, 1].map((side) => {
        const x = 300 + side * 222;
        return (
          <g key={side}>
            <motion.path
              className="mo-line mo-strong"
              d={`M${x} 718 C${x + 2} 700 ${x - 2} 684 ${x + 2} 664`}
              style={{ pathLength: stalk }}
            />
            <motion.g style={{ opacity: ear }}>
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <ellipse
                    className="mo-line"
                    cx={x - 3}
                    cy={658 - i * 12}
                    rx="4"
                    ry="8"
                    transform={`rotate(-28 ${x - 3} ${658 - i * 12})`}
                  />
                  <ellipse
                    className="mo-line"
                    cx={x + 7}
                    cy={658 - i * 12}
                    rx="4"
                    ry="8"
                    transform={`rotate(28 ${x + 7} ${658 - i * 12})`}
                  />
                </g>
              ))}
            </motion.g>
          </g>
        );
      })}
    </Svg>
  );
}

export const MOTIFS: Record<MotifName, ComponentType<MotifProps>> = {
  ground: GroundMotif,
  sea: SeaMotif,
  rays: RaysMotif,
  bloom: BloomMotif,
  stone: StoneMotif,
  hourglass: HourglassMotif,
};
