import type { AssetFormat } from "@/shared";

/**
 * What My Archive can promise today, and the words every surface uses for it (home page, product
 * page, sign-in, the overview, the collection, FAQ). The server builds the offer from the
 * Archive's readiness (server/archive/offer.ts), so a claim appears only once the feature behind
 * it works. It holds booleans only and is safe in public markup.
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

/** What a free account gives right away, in one sentence; null while accounts are off. */
export function freeLine(o: ArchiveOffer): string | null {
  if (!o.accounts) return null;
  return o.orders
    ? "Save the pieces you want to return to, and see your orders in one place, including guest orders placed with the same email."
    : "Save the pieces you want to return to, on every device you sign in to.";
}

/** What a verified purchase opens, in one sentence; null until a purchase can open a story. */
export function purchaseLine(o: ArchiveOffer): string | null {
  if (!o.stories) return null;
  const extras = hasExtras(o) ? " and its available digital extras" : "";
  return `Each design you buy opens its deeper story, a personal note from Richard${extras} in your collection. Signing up alone doesn’t open them.`;
}

/** Whether a purchase brings digital extras on some design today. */
export const hasExtras = (o: ArchiveOffer) => o.wallpapers || o.pdf || o.share;

export const OPEN_TO_ALL =
  "Scripture, biblical context and product descriptions stay open to everyone, with or without an account.";

export const FOUNDING_LINE =
  "The first 50 qualifying buyers who use their Awebound account at checkout receive a Founding Member seal. Guest purchases don’t qualify, and signing up alone doesn’t earn it.";

const join = (items: string[]) =>
  items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

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

/**
 * The product page's note: what buying this piece opens, for this design only. Its extras are
 * mentioned only when this design has some today.
 */
export function productNote(o: ArchiveOffer, name: string, wallpapers: AssetFormat[]) {
  const opens = extrasPhrase(o, wallpapers)
    ? "its deeper story, founder note and available digital extras"
    : "its deeper story and founder note";
  return {
    title: "Your piece continues in My Archive.",
    body: [`Purchase this design to unlock ${opens}.`],
    owned: `${name} is in your Archive, with its story and a note from Richard.`,
  };
}

/**
 * Why the collection is empty and what fills it, in words that match what works today: before
 * orders reach accounts, it says so plainly instead of promising a card.
 */
export function emptyCollection(o: ArchiveOffer): string[] {
  if (!o.orders)
    return [
      "Your collection is for the designs you buy.",
      "Purchases don’t link to accounts yet, so it’s empty for now. Order confirmations and tracking still come by email.",
    ];
  return [
    o.stories
      ? "Each design you buy is kept here, with its deeper story and a personal note from Richard."
      : "Each design you buy is kept here.",
    "It’s empty because no order is linked to this account yet. Orders placed with your account’s email are added on their own, guest checkout included.",
  ];
}

/** The parts of a design's card that open with a purchase, by name, for previews. */
export function lockedRows(o: ArchiveOffer, wallpapers: AssetFormat[]): string[] {
  const rows = ["The story behind the design", "The meaning of its imagery", "A note from Richard"];
  if (wallpapers.length > 0) {
    const noun = wallpaperNoun(wallpapers);
    rows.push(noun[0]!.toUpperCase() + noun.slice(1));
  }
  if (o.pdf && o.share) rows.push("Design card and story images");
  else if (o.pdf) rows.push("Design card (PDF)");
  else if (o.share) rows.push("Story images");
  return rows;
}

/** Remembers which welcome was dismissed: `free` still lets the buyer's welcome show later. */
export const WELCOME_COOKIE = "aw-archive-welcome";

export interface Welcome {
  kind: "free" | "buyer";
  title: string;
  body: string[];
  action: { href: string; label: string };
}

/**
 * The overview's first-visit welcome: for a new account, saving and exploring; for a buyer, the
 * designs that opened (owned and published). `dismissed` is the cookie's value. Null once there is
 * nothing new to say.
 */
export function welcomeFor(
  o: ArchiveOffer,
  dismissed: string | undefined,
  opened: { slug: string; name: string }[],
  firstWallpapers: AssetFormat[],
): Welcome | null {
  const first = opened[0];
  if (first) {
    if (dismissed === "buyer") return null;
    const extras = extrasPhrase(o, firstWallpapers);
    return opened.length > 1
      ? {
          kind: "buyer",
          title: "Your designs are in your Archive.",
          body: ["Each one’s full story and a note from Richard are open in your collection."],
          action: { href: "/account/collection", label: "Open your collection" },
        }
      : {
          kind: "buyer",
          title: `${first.name} is in your Archive.`,
          body: [
            `Its full story and a note from Richard are open.${extras ? ` You’ll also find ${extras}.` : ""}`,
          ],
          action: { href: `/account/collection/${first.slug}`, label: `Open ${first.name}` },
        };
  }
  if (dismissed) return null;
  const body = [
    o.stories
      ? "Save pieces with the heart, and each design you buy opens here with its deeper story and a note from Richard."
      : "Use the heart on any piece to save it here.",
  ];
  return {
    kind: "free",
    title: "Welcome to your Archive.",
    body,
    action: { href: "/shop", label: "Explore Behold" },
  };
}

/**
 * The home page's introduction: one paragraph and one button. The full form names what a purchase
 * opens, so it appears only once stories can open; before that, a short form about saving.
 */
export function homeIntro(o: ArchiveOffer, signedIn: boolean) {
  const cta = signedIn
    ? { href: "/account", label: "Open My Archive" }
    : { href: "/sign-in?next=%2Faccount", label: "Create your free Archive" };
  const space = "My Archive is your personal space for the Awebound pieces you love.";
  const save = signedIn
    ? "Save your favorites with the heart on any piece."
    : "Create a free account to save your favorites.";
  if (!o.stories) {
    const orders = o.orders ? " Your orders are kept there too." : "";
    return {
      full: false,
      title: "Keep the pieces you love.",
      body: `${space} ${save}${orders}`,
      cta,
    };
  }
  const extras = hasExtras(o) ? " and available digital extras" : "";
  return {
    full: true,
    title: "Wear the piece. Know its story.",
    body: `${space} ${save} Each purchased design unlocks its deeper story, a personal note from Richard${extras}, bringing you closer to the Scripture and meaning behind what you wear.`,
    cta,
  };
}
