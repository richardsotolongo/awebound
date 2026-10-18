import "server-only";
import { revalidateTag } from "next/cache";
import {
  findOffersBySlug,
  getOffer,
  listOffers,
  platformConfigured,
  setOfferState,
  type OfferVisibility,
  type PlatformOffer,
} from "../archive/fourthwall-platform";
import { FOURTHWALL_CATALOG_TAG } from "../fourthwall";
import type { CollectionRow, PieceRow } from "./types";

/**
 * The admin is where pieces are published; Fourthwall follows it. A piece shoppers can see (published,
 * in a published release) has its Fourthwall product PUBLIC; every other piece's product is HIDDEN.
 * Read through the Platform API, which sees hidden and archived products, unlike the storefront.
 */

/** Where a piece's Fourthwall product stands. `suggestion` is a live product with the same slug. */
export type OfferLink =
  | { status: "linked"; offer: PlatformOffer }
  | { status: "archived"; offer: PlatformOffer; suggestion: PlatformOffer | null }
  | { status: "missing"; suggestion: PlatformOffer | null }
  | { status: "unavailable"; reason: string };

type Linkable = Pick<PieceRow, "fourthwall_offer_id" | "fourthwall_slug">;

const notArchived = (offers: PlatformOffer[]) =>
  offers.find((o) => o.access.type === "PUBLIC") ??
  offers.find((o) => o.access.type !== "ARCHIVED") ??
  null;

export async function resolveOffer(piece: Linkable): Promise<OfferLink> {
  if (!platformConfigured())
    return { status: "unavailable", reason: "the Fourthwall API user isn’t set" };
  try {
    const byId = piece.fourthwall_offer_id ? await getOffer(piece.fourthwall_offer_id) : null;
    if (byId && byId.access.type !== "ARCHIVED") return { status: "linked", offer: byId };
    const sameSlug = notArchived(await findOffersBySlug(piece.fourthwall_slug));
    if (byId) return { status: "archived", offer: byId, suggestion: sameSlug };
    if (!piece.fourthwall_offer_id && sameSlug) return { status: "linked", offer: sameSlug };
    return { status: "missing", suggestion: sameSlug };
  } catch (err) {
    return { status: "unavailable", reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Every Fourthwall product by id (hidden and archived too), or null when the API can't be read. */
export async function offersById(): Promise<Map<string, PlatformOffer> | null> {
  if (!platformConfigured()) return null;
  try {
    const all: PlatformOffer[] = [];
    for (let page = 0; page < 5; page++) {
      const batch = await listOffers(page);
      all.push(...batch);
      if (batch.length < 100) break;
    }
    return new Map(all.map((o) => [o.id, o]));
  } catch {
    return null;
  }
}

/** What Fourthwall should show for the piece, given where it stands on the site. */
export const expectedVisibility = (piece: PieceRow, collection: CollectionRow): OfferVisibility =>
  piece.status === "published" && collection.status === "published" ? "PUBLIC" : "HIDDEN";

/** PUBLIC counts as listed; HIDDEN and PRIVATE as unlisted. */
export const visibilityOf = (offer: PlatformOffer): OfferVisibility =>
  offer.access.type === "PUBLIC" ? "PUBLIC" : "HIDDEN";

export interface VisibilityResult {
  changed: string[];
  failed: { slug: string; message: string }[];
}

/**
 * Sets each piece's Fourthwall product to `state` (pieces without an offer id are skipped), then
 * refreshes the cached storefront list so the site sees the change at once.
 */
export async function setVisibility(
  pieces: Pick<PieceRow, "slug" | "fourthwall_offer_id">[],
  state: OfferVisibility,
): Promise<VisibilityResult> {
  const result: VisibilityResult = { changed: [], failed: [] };
  if (!platformConfigured()) return result;
  for (const piece of pieces) {
    if (!piece.fourthwall_offer_id) continue;
    try {
      await setOfferState(piece.fourthwall_offer_id, state);
      result.changed.push(piece.slug);
    } catch (err) {
      result.failed.push({
        slug: piece.slug,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
  if (result.changed.length) revalidateTag(FOURTHWALL_CATALOG_TAG, { expire: 0 });
  return result;
}

/** One line for the owner about what happened in Fourthwall, or null when nothing did. */
export function describeVisibility(result: VisibilityResult, state: OfferVisibility) {
  const word = state === "PUBLIC" ? "public" : "hidden";
  if (result.failed.length)
    return `Fourthwall didn’t change for ${result.failed.map((f) => f.slug).join(", ")} (${result.failed[0]!.message}). Use “Match the site” on its Fourthwall tab to try again.`;
  if (result.changed.length)
    return result.changed.length === 1
      ? `Its Fourthwall product is ${word} now.`
      : `${result.changed.length} Fourthwall products are ${word} now.`;
  return platformConfigured()
    ? null
    : "Fourthwall wasn’t changed: the Fourthwall API user isn’t set.";
}
