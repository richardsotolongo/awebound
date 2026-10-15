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
  "plate-oxblood": "#642328",
  "plate-ochre": "#bf9865",
  "plate-sage": "#768069",
  "plate-cornflower": "#6d809a",
  "plate-slate": "#40525c",
  "plate-crimson": "#83393a",
  "plate-sandstone": "#ddc6ad",
  "plate-rose": "#c9aba3",
  "plate-linen": "#d1c0af",
  "plate-concrete": "#c1af9b",
} as const;

/** The ink a plate's lettering takes (`plate.ink` in the content file). */
export const INK_HEX = { bone: "#F0E6D2", coal: "#151413" } as const;
