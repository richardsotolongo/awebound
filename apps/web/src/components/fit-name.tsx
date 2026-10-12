import type { CSSProperties } from "react";

/**
 * How wide each character of Grenze Gotisch sets at weight 600, in thousandths of an em
 * (measured in the browser with the site's own font file). Re-measure if the display font or
 * its weight changes.
 */
// prettier-ignore
const WIDTHS: Record<string, number> = {
  A: 610, B: 571, C: 463, D: 584, E: 540, F: 510, G: 532, H: 621, I: 377, J: 386, K: 588, L: 468,
  M: 894, N: 610, O: 564, P: 547, Q: 564, R: 608, S: 536, T: 466, U: 609, V: 519, W: 722, X: 496,
  Y: 485, Z: 547, a: 435, b: 462, c: 362, d: 466, e: 418, f: 283, g: 441, h: 466, i: 244, j: 233,
  k: 465, l: 240, m: 709, n: 490, o: 471, p: 469, q: 463, r: 336, s: 375, t: 306, u: 484, v: 424,
  w: 654, x: 438, y: 426, z: 403, " ": 162, ".": 211, ",": 229, "'": 173, "’": 229, "&": 578,
  "-": 322, ":": 212, "!": 281, "?": 442,
};
/** For a character not in the table: wider than most, so the name can only come up short. */
const UNKNOWN = 650;

/**
 * A release's name set to fill its line (`.aw-fit` in the brand package): the name's width in
 * ems is worked out here, so the size is right on the first paint at any width.
 */
export function FitName({
  children,
  as: Heading = "h2",
  id,
}: {
  children: string;
  as?: "h1" | "h2";
  id?: string;
}) {
  const ems = [...children].reduce((sum, ch) => sum + (WIDTHS[ch] ?? UNKNOWN), 0) / 1000;
  return (
    <Heading id={id} className="aw-fit" style={{ "--ems": ems.toFixed(3) } as CSSProperties}>
      <span>{children}</span>
    </Heading>
  );
}
