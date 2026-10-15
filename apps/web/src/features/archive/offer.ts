import type { AssetFormat } from "@/shared";

/**
 * What My Archive can promise today, and the words every surface uses for it (home page, product
 * page, sign-in, the overview, FAQ). The server builds the offer from the Archive's readiness
 * (server/archive/offer.ts), so a claim appears only once the feature behind it works. It holds
 * booleans only and is safe in public markup.
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

/** What an account gives right away. */
export function freeBenefits(o: ArchiveOffer): string[] {
  if (!o.accounts) return [];
  const out = ["Save the pieces you want to return to."];
  if (o.orders)
    out.push("See your orders in one place, including guest orders with the same email.");
  return out;
}

/** What each design bought with the account opens in My Archive. */
export function purchaseBenefits(o: ArchiveOffer): string[] {
  if (!o.stories) return [];
  const out = [
    "Read the story behind the design and the meaning of its imagery.",
    "Read a personal note from Richard.",
    "Keep the design’s card in your collection.",
  ];
  if (o.wallpapers) out.push("Download its published phone and desktop wallpapers.");
  if (o.pdf && o.share)
    out.push("Download its design card as a PDF and make story images to share.");
  else if (o.pdf) out.push("Download its design card as a PDF.");
  else if (o.share) out.push("Make story images to share.");
  return out;
}

/** Whether a purchase brings digital extras on some design today. */
export const hasExtras = (o: ArchiveOffer) => o.wallpapers || o.pdf || o.share;

export const SIGNUP_ALONE =
  "Signing up on its own doesn’t open a design’s story or extras. A paid order linked to your account does, and a guest order counts once it’s linked.";

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

/** The product page's note: what buying this piece opens, for this design only. */
export function productNote(o: ArchiveOffer, name: string, wallpapers: AssetFormat[]) {
  const extras = extrasPhrase(o, wallpapers);
  const body = [
    `Buy ${name} while signed in and its card opens in My Archive, with the story behind the design, the meaning of its imagery and a note from Richard.`,
  ];
  if (extras) body.push(`You’ll also find ${extras}.`);
  if (o.orders) body.push("A guest order opens it too, once you join with the same email.");
  return {
    title: "Your piece continues in My Archive.",
    body,
    owned: `${name} is in your Archive, with its story and a note from Richard.`,
  };
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
  const body = ["Use the heart on any piece to save it here, and explore Behold."];
  if (o.stories)
    body.push(
      "When you buy a piece while signed in, its full story and a note from Richard open here.",
    );
  return {
    kind: "free",
    title: "Welcome to your Archive.",
    body,
    action: { href: "/shop", label: "Explore Behold" },
  };
}

/** The home page's introduction: the full form once stories open, a short one before. */
export function homeIntro(o: ArchiveOffer, signedIn: boolean) {
  const cta = signedIn
    ? { href: "/account", label: "Open My Archive" }
    : { href: "/sign-in?next=%2Faccount", label: "Create your free Archive" };
  const kept = o.orders ? "the pieces you save and your orders" : "the pieces you save";
  if (!o.stories) {
    return {
      full: false,
      title: "Keep the pieces you love.",
      body: signedIn
        ? `My Archive keeps ${kept} in one place. Use the heart on any piece to save it.`
        : `Create a free Awebound account and My Archive keeps ${kept} in one place.`,
      points: [] as string[],
      cta,
    };
  }
  const save = signedIn
    ? "Save your favorites with the heart on any piece."
    : "Create a free account to save your favorites.";
  const extras = hasExtras(o) ? " and its published digital extras" : "";
  return {
    full: true,
    title: "Wear the piece. Know its story.",
    body: `My Archive brings your Awebound pieces and their meaning together. ${save} Each design you buy opens a deeper look at the Scripture and imagery behind it, a personal note from Richard${extras}.`,
    points: signedIn
      ? []
      : [
          "Free to join, and never needed to order.",
          ...(o.orders ? ["Guest orders with the same email link to your account."] : []),
          "Scripture and its context stay open to everyone.",
        ],
    cta,
  };
}
