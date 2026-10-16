import type { CategorySlug } from "@/shared";

/**
 * Guides: pages written for searches the shop doesn't answer ("Christian hoodies", "Bible verse
 * shirts"), built from the catalog so prices, Scripture and story text never drift. They are
 * unlisted (the owner's decision): nothing in the header, footer, shop, home or product pages
 * links to them. Crawlers find them through the sitemap, llms.txt, IndexNow and their links to
 * each other. Copy that names pieces needs a look when a release adds or removes one.
 */
export const GUIDES_PATH = "/christian-apparel";
export const guideHref = (slug: string) => `${GUIDES_PATH}/${slug}`;

export type GuideBlock =
  /** The pieces as shop cards: image, name, type, price and Scripture. */
  | { kind: "cards" }
  /** Each piece's name and what its art shows. */
  | { kind: "art"; heading: string }
  /** The fabric, grouped by the pieces that share it. */
  | { kind: "fabric"; heading: string }
  /** Each garment's fit and measurements, with the pieces made on it. */
  | { kind: "fit"; heading?: string }
  /** Each piece under its reference: the quotation, the piece and its art, with a close-up. */
  | { kind: "verses" }
  /** Each piece under the name of its symbol: what the art shows and what it means. */
  | { kind: "symbols"; labels: Record<string, string> };

export interface Guide {
  slug: string;
  /** The page title, before " · Awebound". Worded the way people search. */
  title: string;
  heading: string;
  /** The meta description, and the guide's line on the hub and in llms.txt. */
  description: string;
  /** The paragraph under the heading. */
  intro: string;
  /** The pieces it shows: every piece, one category, or these slugs in this order. */
  pieces: "all" | { category: CategorySlug } | { slugs: string[] };
  blocks: GuideBlock[];
}

const garment = (heading: string, category: CategorySlug, intro: string) => ({
  heading,
  intro,
  pieces: { category },
  blocks: [
    { kind: "cards" },
    { kind: "art", heading: "The artwork" },
    { kind: "fabric", heading: "Fabric" },
    { kind: "fit", heading: "Fit and sizes" },
  ] satisfies GuideBlock[],
});

export const GUIDES: Guide[] = [
  {
    slug: "hoodies",
    title: "Christian hoodies",
    description:
      "Hoodies printed with Scripture on heavyweight fleece: Torn Veil (Matthew 27:51), Fear Not (Psalm 23:4) and Wonderfully Made (Psalm 139:14).",
    ...garment(
      "Christian hoodies",
      "hoodies",
      "Each Awebound hoodie carries one passage of Scripture in its artwork. They’re cut relaxed, in heavyweight fleece that’s brushed on the inside.",
    ),
  },
  {
    slug: "oversized-tees",
    title: "Christian oversized t-shirts",
    description:
      "Oversized tees printed with Scripture: Thorns to Lilies, To Live Is Christ, By His Hem, Stone in Motion and Still the Storm.",
    ...garment(
      "Christian oversized tees",
      "oversized-tees",
      "Each of these tees is an oversized cut with one passage of Scripture in its artwork. To Live Is Christ and Still the Storm are cut larger, in organic cotton.",
    ),
  },
  {
    slug: "hats",
    title: "Christian hats",
    description:
      "Lamb’s Mark is embroidered with the Lamb of God inside a crown of thorns. The Signature Cap carries the Awebound wordmark, thorned in red.",
    ...garment(
      "Christian hats",
      "hats",
      "Lamb’s Mark is a distressed cotton twill cap with the Lamb of God embroidered inside a crown of thorns. The Signature Cap carries the Awebound wordmark, printed in white and thorned in red. Both are one size, with a strap that adjusts.",
    ),
  },
  {
    slug: "bible-verse-clothing",
    title: "Bible verse shirts, hoodies and hats",
    heading: "Bible verse clothing",
    description:
      "Every Awebound piece starts with one passage of Scripture. Here are the verses in Bible order, each with the piece that carries it.",
    intro:
      "Every Awebound design starts with one passage of Scripture. Here they are in the order they appear in the Bible, each with the piece that carries it.",
    pieces: {
      slugs: [
        "the-passage",
        "wonderfully-made",
        "thorns-to-lilies",
        "by-his-hem",
        "torn-veil",
        "stone-in-motion",
        "still-the-storm",
        "lambs-mark",
        "signature-cap",
        "to-live-is-christ",
      ],
    },
    blocks: [{ kind: "verses" }],
  },
  {
    slug: "symbols",
    title: "Christian symbols and what they mean",
    heading: "The symbols in Behold",
    description:
      "What the imagery on each Awebound design means: the crown of thorns, the torn veil, the stone rolled away and the Lamb of God, each with its Scripture.",
    intro:
      "Awebound’s art uses symbols. Out of reverence, it never shows Jesus, God the Father or the Holy Spirit as a person. Each symbol below comes from a passage of Scripture.",
    pieces: "all",
    blocks: [
      {
        kind: "symbols",
        labels: {
          "thorns-to-lilies": "Thorns and lilies",
          "to-live-is-christ": "The hourglass",
          "by-his-hem": "The hem of His garment",
          "stone-in-motion": "The stone rolled away",
          "still-the-storm": "The wind and the waves",
          "torn-veil": "The torn veil",
          "the-passage": "The valley of the shadow of death",
          "wonderfully-made": "Roses around a cross",
          "lambs-mark": "The Lamb of God",
          "signature-cap": "Red thorns",
        },
      },
    ],
  },
  {
    slug: "easter",
    title: "Easter shirts and hoodies: He is risen",
    heading: "Easter: the cross and the empty tomb",
    description:
      "Awebound pieces drawn from Easter: the veil torn when Jesus died, the stone rolled away and the Lamb of God, each with its passage of Scripture.",
    intro:
      "At Easter, Christians remember the death of Jesus on the cross and His resurrection on the third day. These pieces carry that story in their art.",
    pieces: {
      slugs: ["lambs-mark", "thorns-to-lilies", "torn-veil", "stone-in-motion", "signature-cap"],
    },
    blocks: [{ kind: "verses" }],
  },
  {
    slug: "size-charts",
    title: "Size charts",
    heading: "Size charts",
    description:
      "Measurements in inches for every Awebound tee, hoodie and cap, with how to measure and the pieces made on each garment.",
    intro: "Each chart is for one garment, with the Awebound pieces made on it.",
    pieces: "all",
    blocks: [{ kind: "fit" }],
  },
];

export const findGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
