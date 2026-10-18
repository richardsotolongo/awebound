import { collectionHref, type AssetFormat } from "@/shared";

/**
 * What My Archive holds, and the words every surface uses for it (home page, product page,
 * sign-in, the overview, the collection, FAQ). The server builds the offer from the Archive's
 * readiness (server/archive/offer.ts); it holds booleans only and is safe in public markup.
 *
 * The explanation names everything the Archive holds (the deeper story, Richard's note, the
 * Scripture and biblical context, the wallpapers and other extras) wherever accounts are open:
 * the owner's choice (October 2026), so the site explains the whole Archive while its last
 * back-end steps are finished. What a person actually gets (an owner's link to a card, a buyer's
 * welcome, the collection's contents, the Founding seal) still follows what works today.
 */
export interface ArchiveOffer {
  /** Free accounts: sign-in works and saved pieces can be stored. */
  accounts: boolean;
  /** Paid orders reach accounts, so they can be linked. */
  orders: boolean;
  /** A past order placed with another email can be linked with a code sent to that email. */
  claims: boolean;
  /** A linked purchase opens its design's story: orders arrive and a design is published. */
  stories: boolean;
  /** Owners can download a published phone or desktop wallpaper. */
  wallpapers: boolean;
  /** Owners can download a design card PDF. */
  pdf: boolean;
  /** Owners can make story images. */
  share: boolean;
  /** Founding Member places are being awarded and not all of them are taken. */
  foundingOpen: boolean;
}

export const NO_OFFER: ArchiveOffer = {
  accounts: false,
  orders: false,
  claims: false,
  stories: false,
  wallpapers: false,
  pdf: false,
  share: false,
  foundingOpen: false,
};

export const join = (items: string[]) =>
  items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/** What a tile on the sign-in page shows, so its picture can be drawn. */
export type TileKind =
  "save" | "devices" | "orders" | "open" | "story" | "note" | "card" | "extras";

export interface ArchiveTile {
  kind: TileKind;
  title: string;
  body: string;
}

/**
 * The sign-in page's tiles, in two groups: what the account includes, and what each design bought
 * with it opens. Empty while accounts are off.
 */
export function archiveTiles(o: ArchiveOffer): { free: ArchiveTile[]; purchase: ArchiveTile[] } {
  if (!o.accounts) return { free: [], purchase: [] };
  const free: ArchiveTile[] = [
    {
      kind: "save",
      title: "Save with the heart",
      body: "Tap the heart on any piece and it waits for you in My Archive.",
    },
    {
      kind: "devices",
      title: "On every device",
      body: "Sign in on your phone or your computer and your saved pieces are there.",
    },
    {
      kind: "orders",
      title: "Your orders together",
      body: "Every order in one place, guest orders placed with the same email included.",
    },
    {
      kind: "open",
      title: "Open to everyone",
      body: "Scripture, biblical context and every piece’s description stay open, account or not. Guest checkout is always there.",
    },
  ];
  const purchase: ArchiveTile[] = [
    {
      kind: "story",
      title: "The deeper design story",
      body: "The story behind the design and what its imagery means.",
    },
    {
      kind: "note",
      title: "A founder’s note from Richard",
      body: "A personal note from Richard about the piece.",
    },
    {
      kind: "card",
      title: "Scripture and biblical context",
      body: "The design’s card in your collection keeps its Scripture and the biblical context behind it.",
    },
    {
      kind: "extras",
      title: "Wallpapers and extras",
      body: "Phone and desktop wallpapers, a design card PDF and story images to share.",
    },
  ];
  return { free, purchase };
}

/** Under the purchase tiles: what opens them, and what doesn't. */
export const PURCHASE_NOTE =
  "A purchase linked to your account opens them, guest orders with the same email included. Signing up alone doesn’t.";

export const FOUNDING_LINE =
  "The first 50 qualifying buyers who use their Awebound account at checkout receive a Founding Member seal. Guest purchases don’t qualify, and signing up alone doesn’t earn it.";

const wallpaperNoun = (formats: AssetFormat[]) =>
  formats.length > 1 ? "phone and desktop wallpapers" : `${formats[0]} wallpaper`;

/** The extras one design's card holds today, as a phrase ("its phone wallpaper and a design card PDF"). */
export function extrasPhrase(o: ArchiveOffer, wallpapers: AssetFormat[]): string | null {
  const items = [
    wallpapers.length > 0 ? `its ${wallpaperNoun(wallpapers)}` : null,
    o.pdf ? "a design card PDF" : null,
    o.share ? "story images to share" : null,
  ].filter((x): x is string => Boolean(x));
  return items.length > 0 ? join(items) : null;
}

/** The product page's note: what buying this piece opens in My Archive. */
export function productNote(name: string) {
  return {
    title: "Your piece continues in My Archive.",
    body: [
      "Purchase this design to unlock the deeper story behind it, a founder’s note from Richard and digital extras like phone and desktop wallpapers, kept with its Scripture and biblical context.",
    ],
    owned: `${name} is in your Archive, with its story and a note from Richard.`,
  };
}

/** What each design bought brings to the collection, listed under the empty collection's heading. */
export const COLLECTION_HOLDS = [
  "The deeper story behind the design",
  "The meaning of its imagery",
  "A founder’s note from Richard",
  "Its Scripture and biblical context",
  "Phone and desktop wallpapers",
  "A design card PDF and story images to share",
];

/**
 * The empty collection: what each design bought brings to it (the whole Archive, as every
 * explanation names it), then why it is empty in words that match what works today. Before orders
 * reach accounts, it says so plainly.
 */
export function emptyCollection(o: ArchiveOffer): { lead: string; holds: string[]; why: string } {
  return {
    lead: "Each design you buy is kept here, with:",
    holds: COLLECTION_HOLDS,
    why: o.orders
      ? "It’s empty because no order is linked to this account yet. Orders placed with your account’s email are added on their own, guest checkout included."
      : "Purchases don’t link to accounts yet, so it’s empty for now. Order confirmations and tracking still come by email.",
  };
}

/** The parts of a design's card that open with a purchase, by name, for previews. */
export function lockedRows(wallpapers: AssetFormat[]): string[] {
  const noun = wallpapers.length > 0 ? wallpaperNoun(wallpapers) : "phone and desktop wallpapers";
  return [
    "The story behind the design",
    "The meaning of its imagery",
    "A founder’s note from Richard",
    noun[0]!.toUpperCase() + noun.slice(1),
    "Design card PDF and story images",
  ];
}

export interface Welcome {
  kind: "free" | "buyer";
  title: string;
  body: string[];
  /** What Your collection holds for each design bought (the empty collection's own list). */
  lead: string;
  holds: string[];
  action: { href: string; label: string };
  /** A second, quieter way in: Your collection, when the first action goes elsewhere. */
  more: { href: string; label: string } | null;
}

const WELCOME_LEAD = "Each design you buy is kept in Your collection, with:";
const OPEN_COLLECTION = { href: "/account/collection", label: "Open your collection" };

/**
 * The overview's welcome, always shown (the owner's choice, October 2026: with the tiles moved to
 * the navigation, it and Idea Submissions are the overview): for an account with no design open
 * yet, saving and exploring; for a buyer, the designs that opened (owned and published). Either
 * way it lists what Your collection keeps for each design, so that isn't hidden behind the button.
 */
export function welcomeFor(
  o: ArchiveOffer,
  opened: { slug: string; name: string }[],
  firstWallpapers: AssetFormat[],
): Welcome {
  const first = opened[0];
  if (first) {
    const extras = extrasPhrase(o, firstWallpapers);
    return opened.length > 1
      ? {
          kind: "buyer",
          title: "Your designs are in your Archive.",
          body: ["Each one’s full story and a note from Richard are open in your collection."],
          lead: WELCOME_LEAD,
          holds: COLLECTION_HOLDS,
          action: OPEN_COLLECTION,
          more: null,
        }
      : {
          kind: "buyer",
          title: `${first.name} is in your Archive.`,
          body: [
            `Its full story and a note from Richard are open.${extras ? ` You’ll also find ${extras}.` : ""}`,
          ],
          lead: WELCOME_LEAD,
          holds: COLLECTION_HOLDS,
          action: { href: collectionHref(first.slug), label: `Open ${first.name}` },
          more: OPEN_COLLECTION,
        };
  }
  return {
    kind: "free",
    title: "Welcome to your Archive.",
    body: ["Save the pieces you love with the heart and find them again under Saved."],
    lead: WELCOME_LEAD,
    holds: COLLECTION_HOLDS,
    action: { href: "/shop", label: "Explore Behold" },
    more: OPEN_COLLECTION,
  };
}

/** The home page's introduction: one paragraph and one button. */
export function homeIntro(o: ArchiveOffer, signedIn: boolean) {
  const cta = signedIn
    ? { href: "/account", label: "Open My Archive" }
    : { href: "/sign-in?next=%2Faccount", label: "Create your free Archive" };
  const save = signedIn
    ? "Save your favorites with the heart on any piece."
    : "Create a free account to save your favorites.";
  return {
    full: o.accounts,
    title: "Wear the piece. Know its story.",
    body: `My Archive is your personal space for the Awebound pieces you love. ${save} Each design you buy unlocks its deeper story, a personal note from Richard and digital extras like phone and desktop wallpapers, all kept with its Scripture and biblical context, bringing you closer to the meaning behind what you wear.`,
    cta,
  };
}

/**
 * After a guest purchase, on the band under the header and in the next morning's email: the pieces
 * bought and what an account with the checkout email opens. The order links itself by that email,
 * so it is shown only while orders reach accounts (`offer.orders`).
 */
export function guestOrderNote(names: string[]) {
  const one = names.length === 1;
  const opens = one
    ? "its deeper story, a founder’s note from Richard and digital extras like phone and desktop wallpapers, kept with its Scripture and biblical context"
    : "the deeper story behind each, a founder’s note from Richard and digital extras like phone and desktop wallpapers, kept with their Scripture and biblical context";
  return {
    title: "Thank you for your order.",
    lead: `${join(names)} ${one ? "continues" : "continue"} in My Archive.`,
    site: `Create a free account with the email you used at checkout to open ${opens}.`,
    email: `Create a free account with this email address to open ${opens}.`,
    cta: { href: "/sign-in?next=%2Faccount", label: "Create your free Archive" },
  };
}
