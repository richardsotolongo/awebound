import type { AssetFormat } from "@/shared";

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

/**
 * What the seal includes (the owner's choice, October 2026), on the Founding tab and in the FAQ.
 * No discounts or points. Early access is listed as to be announced, with no date, until it is
 * built (docs/TODOS.md); then this line names it plainly, as do the FAQ and the seal rules.
 */
export const FOUNDING_PERKS = [
  "Idea Submissions without more purchases: send one whenever the last has been reviewed",
  "Your own numbered Founding Member wallpapers, for phone and desktop",
  "A note from Richard before each release",
  "The Thorn Cross on your My Archive button",
  "Early access to collections, to be announced",
];

const wallpaperNoun = (formats: AssetFormat[]) =>
  formats.length > 1 ? "phone and desktop wallpapers" : `${formats[0]} wallpaper`;

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

/** What each design bought opens in My Archive, listed in the welcome. */
export const COLLECTION_HOLDS = [
  "The story behind the design",
  "The meaning of its imagery",
  "A founder’s note from Richard",
  "Its Scripture and biblical context",
  "Phone and desktop wallpapers",
  "A design card PDF and story images",
];

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
  title: string;
  lead: string;
  holds: string[];
  /** Why the collection is empty, in words that match what works today. */
  why: string;
  saved: string;
  /** The Founding Member note, while places are left; gone once all 50 are given out. */
  founding: { title: string; body: string } | null;
}

/**
 * The welcome on an empty collection (the owner's choice, October 2026: few words, each point on
 * its own line). It names everything a design opens, as every explanation of the Archive does.
 */
export function welcomeFor(o: ArchiveOffer): Welcome {
  return {
    title: "Welcome to your Archive.",
    lead: "Each design you buy opens here with:",
    holds: COLLECTION_HOLDS,
    why: o.orders
      ? "Orders placed with this email show up here on their own."
      : "Purchases don’t link to accounts yet.",
    saved: "Tap the heart on any piece to keep it under Saved.",
    founding: o.foundingOpen
      ? {
          title: "The first 50 buyers receive a Founding Member seal.",
          body: "Stay signed in when you check out so your order counts. Guest orders don’t qualify.",
        }
      : null,
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

/** Once a signed-in account holds its seal, on the band under the header (the Founding tab's words). */
export function foundingNotice(honorary: boolean) {
  return honorary
    ? {
        title: "You are an honorary Founding Member.",
        body: "Richard has given you the seal. Thank you for being part of Awebound.",
      }
    : {
        title: "You are a Founding Member.",
        body: "You were one of the first 50 people to buy from Awebound with your account. Thank you for being here from the beginning.",
      };
}
