/**
 * Raw values for the few places CSS variables can't reach: <meta name="theme-color">, generated
 * images and HTML email. Keep in sync with src/styles/tokens.css; style everything else with tokens.
 */
export const BRAND_HEX = {
  surfacePage: "#0D0C0B",
  coal: "#151413",
  bone: "#F0E6D2",
  warmBone: "#E8DDC9",
  oxblood: "#782B35",
  /** The paper card in emails and the design card PDF. */
  paper: "#F8F2E7",
  /** Muted text on paper. */
  muted: "#4A443D",
} as const;

/** Each piece's plate (`--plate-*` in tokens.css), for generated images. */
export const PLATE_HEX = {
  "plate-oxblood": "#60252b",
  "plate-ochre": "#be9a6a",
  "plate-sage": "#7a836d",
  "plate-cornflower": "#687d98",
  "plate-slate": "#46545c",
  "plate-parchment": "#c9ba9a",
  "plate-terracotta": "#966246",
  "plate-rose": "#be9a96",
  "plate-linen": "#d0cabf",
  "plate-concrete": "#96928c",
} as const;

/** The ink a plate's lettering takes (`plate.ink` in the content file). */
export const INK_HEX = { bone: "#F0E6D2", coal: "#151413" } as const;
