/**
 * Editorial copy for the current release. Product data (names, prices, photos, stock) comes from
 * the API, so prices set in Fourthwall show here on their own; this file only holds the words and
 * order that frame each piece. Verses are quoted from the King James Version, the wording the
 * designs themselves use, and credited "(KJV)" with the reference.
 */

export const RELEASE = {
  slug: "behold",
  number: "01",
  name: "Behold",
  tagline: "A call to see Christ’s power, holiness, sacrifice, and resurrection.",
  reference: "John 1:29",
  pieces: 6,
} as const;

export type MotifName = "ground" | "sea" | "rays" | "bloom" | "stone" | "hourglass";

export interface Vision {
  /** Product slug in the catalog. */
  slug: string;
  numeral: string;
  /** What this piece calls people to see. */
  theme: string;
  /** The headline: "Behold the Lamb". */
  call: string;
  /** KJV text (a whole verse or a clean part of one), quoted with `reference`. */
  verse: string;
  reference: string;
  motif: MotifName;
}

export const VISIONS: Vision[] = [
  {
    slug: "holy-ground",
    numeral: "I",
    theme: "Holiness",
    call: "Behold his holiness",
    verse:
      "Put off thy shoes from off thy feet, for the place whereon thou standest is holy ground.",
    reference: "Exodus 3:5",
    motif: "ground",
  },
  {
    slug: "still-the-storm",
    numeral: "II",
    theme: "Power",
    call: "Behold his power",
    verse:
      "And they feared exceedingly, and said one to another, What manner of man is this, that even the wind and the sea obey him?",
    reference: "Mark 4:41",
    motif: "sea",
  },
  {
    slug: "thorns-to-lilies",
    numeral: "III",
    theme: "Mercy",
    call: "Behold his mercy",
    verse: "Though your sins be as scarlet, they shall be as white as snow.",
    reference: "Isaiah 1:18",
    motif: "bloom",
  },
  {
    slug: "stone-in-motion",
    numeral: "IV",
    theme: "Resurrection",
    call: "Behold, he is risen",
    verse: "He is not here: for he is risen, as he said. Come, see the place where the Lord lay.",
    reference: "Matthew 28:6",
    motif: "stone",
  },
  {
    slug: "to-live-is-christ",
    numeral: "V",
    theme: "Life",
    call: "Behold what we live for",
    verse: "For to me to live is Christ, and to die is gain.",
    reference: "Philippians 1:21",
    motif: "hourglass",
  },
  {
    slug: "lambs-mark",
    numeral: "VI",
    theme: "Sacrifice",
    call: "Behold the Lamb",
    verse: "Behold the Lamb of God, which taketh away the sin of the world.",
    reference: "John 1:29",
    motif: "rays",
  },
];

const NUMERALS: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** 1 → I, 6 → VI. Enough for a release of up to 39 pieces. */
export function toNumeral(n: number): string {
  let rest = Math.max(1, Math.floor(n));
  let out = "";
  for (const [value, glyph] of NUMERALS) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}

export function visionFor(slug: string): Vision | undefined {
  return VISIONS.find((v) => v.slug === slug);
}
