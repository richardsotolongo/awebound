import "server-only";
import { unstable_cache } from "next/cache";
import { NO_OFFER, type ArchiveOffer } from "@/features/archive/offer";
import { accountsEnabled } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AssetFormat } from "@/shared";
import { assetsForOwnedCard } from "./assets";
import { getPublishedPublicCard, listPublishedPublicCards } from "./content";
import { getDesignBySlug } from "./designs";
import { FOUNDING_CAP } from "./founding-policy";
import { getArchiveReadiness } from "./readiness";

/**
 * The public side of the Archive's readiness: what public pages may promise, as booleans, and the
 * design the home page previews. Both are re-read at most once a minute, like the catalog, so the
 * home page doesn't query the database on every visit.
 */

/** Unknown reads as full: a place is never promised that may not exist. */
async function foundingPlacesLeft(): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { count, error } = await supabaseAdmin
    .from("founding_members")
    .select("user_id", { count: "exact", head: true });
  return !error && count !== null && count < FOUNDING_CAP;
}

async function buildOffer(): Promise<ArchiveOffer> {
  const r = await getArchiveReadiness();
  const accounts = accountsEnabled && r.database;
  const orders = accounts && r.orders;
  const stories = orders && r.content;
  return {
    accounts,
    orders,
    claims: orders && r.claims,
    stories,
    wallpapers: stories && r.wallpapers && r.publishedAssets > 0,
    pdf: stories && r.pdf,
    share: stories && r.share,
    foundingOpen: orders && r.founding && (await foundingPlacesLeft()),
  };
}

/** What My Archive can promise right now. A failed read promises nothing. */
export const getArchiveOffer = unstable_cache(
  () => buildOffer().catch(() => NO_OFFER),
  ["archive-offer"],
  { revalidate: 60 },
);

/** A design's published wallpaper formats (never ids or file paths), when wallpapers are offered. */
export async function getDesignWallpapers(
  slug: string,
  offer: ArchiveOffer,
): Promise<AssetFormat[]> {
  if (!offer.wallpapers) return [];
  const design = await getDesignBySlug(slug);
  if (!design) return [];
  const extras = await assetsForOwnedCard(design.design_key);
  return extras.flatMap((x) => (x.status === "published" ? [x.format] : []));
}

/** The published public fields the home page's card preview shows, and nothing else. */
export interface ArchivePreview {
  designKey: string;
  slug: string;
  name: string;
  scriptureReference: string;
  publicPreview: string;
  wallpapers: AssetFormat[];
}

/** By His Hem when it's published, else the first published design. */
const PREVIEW_SLUG = "by-his-hem";

export const getArchivePreview = unstable_cache(
  async (): Promise<ArchivePreview | null> => {
    try {
      const offer = await getArchiveOffer();
      if (!offer.stories) return null;
      const card =
        (await getPublishedPublicCard(PREVIEW_SLUG)) ?? (await listPublishedPublicCards())[0];
      if (!card) return null;
      return {
        designKey: card.designKey,
        slug: card.slug,
        name: card.name,
        scriptureReference: card.scriptureReference,
        publicPreview: card.publicPreview,
        wallpapers: await getDesignWallpapers(card.slug, offer),
      };
    } catch {
      return null;
    }
  },
  ["archive-preview"],
  { revalidate: 60 },
);
