// Generates sample product images (apps/web/public/products/*.svg) for designs that don't have
// photography yet: a flat garment silhouette in its catalog color with the brand's own marks as the
// print. Colors come from packages/brand/src/styles/tokens.css. Replace with real product photos
// before launch (docs/TODOS.md). Run: pnpm --filter @awebound/web art
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LILY,
  THORN_CROSS,
  THORN_VINE,
  THORN_WREATH,
  WORDMARK,
  type MarkGeometry,
} from "../../../packages/brand/src/marks/paths";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../public/products");
mkdirSync(out, { recursive: true });

const tokensCss = readFileSync(join(here, "../../../packages/brand/src/styles/tokens.css"), "utf8");
function token(name: string): string {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6,8})`));
  if (!match?.[1]) throw new Error(`token --${name} not found`);
  return match[1];
}

const BACKDROP = "#D7D4CF"; // light warm grey photo backdrop, per the brand's flat-lay photo setup
const BONE = token("brand-bone");
const COAL = token("brand-coal");

type Cut = "tee" | "oversized" | "tank" | "cap";

const SILHOUETTE: Record<Exclude<Cut, "cap">, string> = {
  tee: "M330 140 C352 162 448 162 470 140 L585 185 L690 360 L600 405 L565 330 L570 880 Q400 896 230 880 L235 330 L200 405 L110 360 L215 185 Z",
  oversized:
    "M325 150 C350 172 450 172 475 150 L612 198 L722 430 L612 474 L585 400 L596 905 Q400 922 204 905 L215 400 L188 474 L78 430 L188 198 Z",
  tank: "M310 118 L346 118 C362 250 438 250 454 118 L490 118 C500 232 560 300 602 330 L606 890 Q400 906 194 890 L198 330 C240 300 300 232 310 118 Z",
};

const CAP_CROWN = "M186 600 C150 236 650 236 614 600 Z";
const CAP_BRIM =
  "M176 598 C262 572 538 572 624 598 C640 668 548 742 400 742 C252 742 160 668 176 598 Z";

function mark(
  geometry: MarkGeometry,
  cx: number,
  cy: number,
  width: number,
  fill: string,
  opacity = 1,
): string {
  const [minX = 0, minY = 0, w = 1, h = 1] = geometry.viewBox.split(/\s+/).map(Number);
  const s = width / w;
  const x = cx - width / 2 - minX * s;
  const y = cy - (h * s) / 2 - minY * s;
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(5)})" opacity="${opacity}"><path d="${geometry.d}" fill="${fill}" fill-rule="evenodd"/></g>`;
}

function rules(cx: number, y: number, ink: string): string {
  return `<g stroke="${ink}" stroke-width="2" opacity=".7"><line x1="${cx - 70}" y1="${y}" x2="${cx - 18}" y2="${y}"/><line x1="${cx + 18}" y1="${y}" x2="${cx + 70}" y2="${y}"/></g><circle cx="${cx}" cy="${y}" r="3" fill="${ink}" opacity=".7"/>`;
}

function garment(cut: Cut, color: string, print: string, title: string): string {
  const shade = `<radialGradient id="shade" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>`;
  const body =
    cut === "cap"
      ? `<path d="${CAP_CROWN}" fill="${color}"/><path d="${CAP_CROWN}" fill="url(#shade)"/>` +
        `<g stroke="#000" stroke-opacity=".18" stroke-width="2" fill="none"><path d="M400 330 L400 590"/><path d="M292 352 C268 440 262 520 268 592"/><path d="M508 352 C532 440 538 520 532 592"/></g>` +
        `<circle cx="400" cy="330" r="10" fill="${color}" stroke="#000" stroke-opacity=".25"/>` +
        print +
        `<path d="${CAP_BRIM}" fill="${color}"/><path d="${CAP_BRIM}" fill="#000" opacity=".16"/>`
      : `<path d="${SILHOUETTE[cut]}" fill="${color}"/><path d="${SILHOUETTE[cut]}" fill="url(#shade)"/>` +
        `<path d="${cut === "tank" ? "M346 118 C362 250 438 250 454 118" : cut === "oversized" ? "M325 150 C350 172 450 172 475 150" : "M330 140 C352 162 448 162 470 140"}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="10"/>` +
        print;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${title}"><title>${title}</title><defs>${shade}</defs><rect width="800" height="1000" fill="${BACKDROP}"/>${body}</svg>\n`;
}

interface Piece {
  file: string;
  cut: Cut;
  color: string;
  title: string;
  print: (ink: string, accent: string) => string;
  ink?: string;
  accent?: string;
}

const darkInk = { ink: BONE };
const lightInk = { ink: COAL };

const smallCross = (ink: string) => mark(THORN_CROSS, 486, 300, 34, ink);
const backPrint = (geometry: MarkGeometry, markWidth: number) => (ink: string, accent: string) =>
  mark(WORDMARK, 400, 300, 300, ink) +
  mark(geometry, 400, 520, markWidth, accent) +
  rules(400, 720, ink);

const pieces: Piece[] = [
  // Fronts for the three designs that have lookbook mockups on the back
  {
    file: "a3-t02-front",
    cut: "oversized",
    color: token("garment-washed-coal"),
    title: "Third Morning front, sample art",
    print: smallCross,
    ...darkInk,
  },
  {
    file: "a3-b01-front",
    cut: "oversized",
    color: token("garment-faded-black"),
    title: "Shattered Dominion front, sample art",
    print: smallCross,
    ...darkInk,
  },
  {
    file: "a3-r01-front",
    cut: "oversized",
    color: token("garment-washed-coal"),
    title: "Throne of Grace front, sample art",
    print: smallCross,
    ...darkInk,
  },
  // Freed in Awe — tee
  {
    file: "a3-b02-back",
    cut: "tee",
    color: token("garment-washed-coal"),
    title: "Freed in Awe back, sample art",
    print: backPrint(THORN_WREATH, 230),
    ...darkInk,
    accent: token("bb-copper"),
  },
  {
    file: "a3-b02-front",
    cut: "tee",
    color: token("garment-warm-bone"),
    title: "Freed in Awe in warm bone, front, sample art",
    print: (ink) => mark(WORDMARK, 400, 280, 150, ink),
    ...lightInk,
  },
  // Stone Rolled Aside — tee
  {
    file: "a3-t01-back",
    cut: "tee",
    color: token("garment-warm-bone"),
    title: "Stone Rolled Aside back, sample art",
    print: backPrint(LILY, 150),
    ...lightInk,
    accent: token("altar-scripture"),
  },
  {
    file: "a3-t01-front",
    cut: "tee",
    color: token("garment-washed-sand"),
    title: "Stone Rolled Aside in washed sand, front, sample art",
    print: smallCross,
    ...lightInk,
  },
  // Unshaken Kingdom — tee
  {
    file: "a3-r02-back",
    cut: "tee",
    color: token("garment-washed-deep-plum"),
    title: "Unshaken Kingdom back, sample art",
    print: backPrint(THORN_CROSS, 120),
    ...darkInk,
    accent: token("rh-muted-gold"),
  },
  {
    file: "a3-r02-front",
    cut: "tee",
    color: token("garment-faded-black"),
    title: "Unshaken Kingdom in faded black, front, sample art",
    print: smallCross,
    ...darkInk,
  },
  // Chains Snapped — tank
  {
    file: "a3-b03-back",
    cut: "tank",
    color: token("garment-washed-graphite"),
    title: "Chains Snapped back, sample art",
    print: (ink, accent) =>
      mark(WORDMARK, 400, 330, 270, ink) +
      mark(THORN_VINE, 400, 500, 320, accent) +
      rules(400, 640, ink),
    ...darkInk,
    accent: token("bb-copper"),
  },
  {
    file: "a3-b03-front",
    cut: "tank",
    color: token("garment-faded-black"),
    title: "Chains Snapped in faded black, front, sample art",
    print: (ink) => mark(WORDMARK, 400, 330, 150, ink),
    ...darkInk,
  },
  // He Is Risen — tank
  {
    file: "a3-t03-back",
    cut: "tank",
    color: token("garment-washed-sand"),
    title: "He Is Risen back, sample art",
    print: (ink, accent) =>
      mark(WORDMARK, 400, 330, 270, ink) + mark(LILY, 400, 545, 140, accent) + rules(400, 720, ink),
    ...lightInk,
    accent: token("ra-olive"),
  },
  {
    file: "a3-t03-front",
    cut: "tank",
    color: token("garment-washed-deep-olive"),
    title: "He Is Risen in washed deep olive, front, sample art",
    print: smallCross,
    ...darkInk,
  },
  // Caps — primary image shows the front panel; hover shows the second colorway
  {
    file: "a3-h01-back",
    cut: "cap",
    color: token("cap-washed-black-twill"),
    title: "Thornbound Cap in washed black twill, sample art",
    print: (ink) => mark(THORN_CROSS, 400, 470, 74, ink),
    ...darkInk,
  },
  {
    file: "a3-h01-front",
    cut: "cap",
    color: token("cap-washed-charcoal-twill"),
    title: "Thornbound Cap in washed charcoal twill, sample art",
    print: (ink) => mark(THORN_CROSS, 400, 470, 74, ink),
    ...darkInk,
  },
  {
    file: "a3-h02-back",
    cut: "cap",
    color: token("cap-oxblood-corduroy"),
    title: "Kingdom Cap in oxblood corduroy, sample art",
    print: (ink) => mark(THORN_WREATH, 400, 470, 124, ink),
    ...darkInk,
  },
  {
    file: "a3-h02-front",
    cut: "cap",
    color: token("cap-sandstone"),
    title: "Kingdom Cap in sandstone, sample art",
    print: (ink) => mark(THORN_WREATH, 400, 470, 124, ink),
    ...lightInk,
  },
];

for (const piece of pieces) {
  const ink = piece.ink ?? BONE;
  const svg = garment(piece.cut, piece.color, piece.print(ink, piece.accent ?? ink), piece.title);
  writeFileSync(join(out, `${piece.file}.svg`), svg);
}
console.info(`wrote ${pieces.length} images to ${out}`);
