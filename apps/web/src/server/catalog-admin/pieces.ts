import "server-only";
import type { z } from "zod";
import type { AssetFormat } from "@/shared";
import type { ImageTargetSchema, PieceContent, PiecePatch, SizeGuideFields } from "@/shared/pieces";
import { listAssets, publishAsset } from "../archive/assets";
import { audit } from "../archive/audit";
import {
  approveDraft,
  getOpenDraft,
  listContentVersions,
  publishContent,
} from "../archive/content";
import { designKeyFor, getDesign, mapOffer } from "../archive/designs";
import { checkPiece, readContent } from "../content";
import { UserError } from "../errors";
import { listProducts, type FourthwallProduct } from "../fourthwall";
import {
  describeVisibility,
  expectedVisibility,
  resolveOffer,
  setVisibility,
  visibilityOf,
  type OfferLink,
} from "./fourthwall-sync";
import { removeImages, db, IMPORT_BUCKET, storeImage, takeUpload, toWebp } from "./storage";
import type { CollectionRow, Extras, PieceRow, SizeGuideRow } from "./types";

/** A piece as the owner manages it: draft, approved and waiting for its release, or published. */

export interface PieceWithCollection {
  piece: PieceRow;
  collection: CollectionRow;
}

export async function listPieces(): Promise<PieceWithCollection[]> {
  const { data, error } = await db()
    .from("pieces")
    .select("*, collection:collections(*)")
    .order("position");
  if (error) throw new Error(`pieces read failed: ${error.message}`);
  return ((data ?? []) as (PieceRow & { collection: CollectionRow })[]).map(
    ({ collection, ...piece }) => ({ piece, collection }),
  );
}

export async function getPiece(slug: string): Promise<PieceWithCollection | null> {
  const { data } = await db()
    .from("pieces")
    .select("*, collection:collections(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const { collection, ...piece } = data as PieceRow & { collection: CollectionRow };
  return { piece, collection };
}

async function requirePiece(slug: string): Promise<PieceWithCollection> {
  const found = await getPiece(slug);
  if (!found) throw new UserError("That piece doesn’t exist.");
  return found;
}

export async function listSizeGuides(): Promise<SizeGuideRow[]> {
  const { data, error } = await db().from("size_guides").select("*").order("id");
  if (error) throw new Error(`size guides read failed: ${error.message}`);
  return (data ?? []) as SizeGuideRow[];
}

/** Whether a shopper sees the piece: published, in a published release. */
export const isLive = ({ piece, collection }: PieceWithCollection) =>
  piece.status === "published" && collection.status === "published";

export const designKeyOf = ({ piece, collection }: PieceWithCollection) =>
  designKeyFor(collection.slug, piece.slug);

/** The piece in the catalog's own shape, to check it the way the site reads it. */
export function toContent(piece: PieceRow, collectionSlug: string): PieceContent {
  return {
    code: piece.code,
    slug: piece.slug,
    name: piece.name,
    collection: collectionSlug,
    category: piece.category,
    position: piece.position,
    colors: piece.colors,
    priceCents: piece.price_cents,
    sizePriceCents: piece.size_price_cents,
    featured: piece.featured,
    releasedAt: piece.released_at,
    scripture: piece.scripture,
    fourthwallSlug: piece.fourthwall_slug,
    fourthwallOfferId: piece.fourthwall_offer_id ?? undefined,
    sizeGuide: piece.size_guide_id ?? undefined,
    story: piece.story,
    images: piece.images,
    plate: piece.plate ?? undefined,
    media: piece.media,
  };
}

/** Refuses a piece the site couldn't show (an unknown category, a price for a size it lacks…). */
async function mustHoldTogether(piece: PieceRow, collectionSlug: string) {
  const content = await readContent(db());
  try {
    checkPiece(content, toContent(piece, collectionSlug));
  } catch (err) {
    throw new UserError(`That doesn’t hold together: ${(err as Error).message}.`);
  }
}

/** Saves the review page's edits. Returns whether shoppers see the piece (then pages refresh). */
export async function editPiece(slug: string, patch: PiecePatch, actor: string) {
  const found = await requirePiece(slug);
  const { piece, collection } = found;
  if (patch.images) {
    const same = (a: { url: string }[]) =>
      a
        .map((i) => i.url)
        .sort()
        .join("\n");
    if (same(patch.images) !== same(piece.images))
      throw new UserError("The images changed. Reload the page and try again.");
  }
  const columns = {
    ...(patch.name !== undefined && { name: patch.name }),
    ...(patch.code !== undefined && { code: patch.code }),
    ...(patch.category !== undefined && { category: patch.category }),
    ...(patch.colors !== undefined && { colors: patch.colors }),
    ...(patch.priceCents !== undefined && { price_cents: patch.priceCents }),
    ...(patch.sizePriceCents !== undefined && { size_price_cents: patch.sizePriceCents }),
    ...(patch.featured !== undefined && { featured: patch.featured }),
    ...(patch.scripture !== undefined && { scripture: patch.scripture }),
    ...(patch.story !== undefined && { story: patch.story }),
    ...(patch.plate !== undefined && { plate: patch.plate }),
    ...(patch.images !== undefined && { images: patch.images }),
    ...(patch.fourthwallSlug !== undefined && { fourthwall_slug: patch.fourthwallSlug }),
    ...(patch.sizeGuideId !== undefined && { size_guide_id: patch.sizeGuideId }),
  };
  const next = { ...piece, ...columns } as PieceRow;
  await mustHoldTogether(next, collection.slug);

  const { error } = await db().from("pieces").update(columns).eq("id", piece.id);
  if (error?.code === "23505")
    throw new UserError("Another piece already has that code or Fourthwall slug.");
  if (error) throw new Error(`piece save failed: ${error.message}`);

  const designKey = designKeyOf(found);
  await db()
    .from("archive_designs")
    .update({
      name: next.name,
      scripture_reference: next.scripture.reference,
      fourthwall_slug: next.fourthwall_slug,
    })
    .eq("design_key", designKey);
  const offerId = patch.fourthwallOfferId;
  if (offerId !== undefined && offerId !== (piece.fourthwall_offer_id ?? "")) {
    if (offerId) {
      await mapOffer(designKey, offerId, actor).catch((err: Error) => {
        throw err.message.includes("duplicate")
          ? new UserError("Another piece already has that offer id.")
          : err;
      });
    } else {
      await db().from("pieces").update({ fourthwall_offer_id: null }).eq("id", piece.id);
      await db()
        .from("archive_designs")
        .update({ fourthwall_offer_id: null })
        .eq("design_key", designKey);
    }
  }
  await audit(actor, "piece.save", "piece", piece.id, null, patch);
  return isLive(found);
}

/** Saves a size guide's words and measurements, if every piece using it still holds together. */
export async function saveSizeGuide(id: string, fields: SizeGuideFields, actor: string) {
  for (const row of fields.rows) {
    if (row.values.length !== fields.measures.length)
      throw new UserError(`${row.size} needs ${fields.measures.length} values.`);
  }
  const { data: before } = await db().from("size_guides").select("*").eq("id", id).maybeSingle();
  if (!before) throw new UserError("That size guide doesn’t exist.");
  const sizes = fields.rows.map((r) => r.size);
  const users = (await listPieces()).filter((p) => p.piece.size_guide_id === id);
  for (const { piece } of users) {
    const extra = Object.keys(piece.size_price_cents).find((s) => !sizes.includes(s));
    if (extra)
      throw new UserError(`${piece.name} has a price for ${extra}, which the guide drops.`);
  }
  const { error } = await db().from("size_guides").update(fields).eq("id", id);
  if (error) throw new Error(`size guide save failed: ${error.message}`);
  await audit(actor, "size_guide.save", "size_guide", id, before, fields);
  return users.some(isLive);
}

type Target = z.output<typeof ImageTargetSchema>;

/** Puts a replaced image in place (as WebP, named after its content) and removes the old one. */
export async function replaceImage(target: Target, path: string, actor: string) {
  const bytes = await takeUpload(path);
  if (target.kind === "guide") {
    const webp = await toWebp(bytes, 1600);
    const url = await storeImage("size-guides", target.id, webp.bytes);
    const { data: guide } = await db()
      .from("size_guides")
      .select("image")
      .eq("id", target.id)
      .maybeSingle();
    if (!guide) throw new UserError("That size guide doesn’t exist.");
    const image = { url, width: webp.width, height: webp.height };
    await db().from("size_guides").update({ image }).eq("id", target.id);
    await removeImages([(guide.image as { url: string } | null)?.url], [url]);
    await audit(actor, "size_guide.image", "size_guide", target.id, guide.image, image);
    const users = (await listPieces()).filter((p) => p.piece.size_guide_id === target.id);
    return users.some(isLive);
  }

  if (target.kind === "collection") {
    const webp = await toWebp(bytes, 2400);
    const url = await storeImage(`collections/${target.slug}`, target.slot, webp.bytes);
    const column = target.slot === "cover" ? "cover_image" : "plate_image";
    const { data: before } = await db()
      .from("collections")
      .select(column)
      .eq("slug", target.slug)
      .maybeSingle();
    if (!before) throw new UserError("That collection doesn’t exist.");
    await db()
      .from("collections")
      .update({ [column]: url })
      .eq("slug", target.slug);
    const old = (before as Record<string, string | null>)[column];
    await removeImages([old], [url]);
    await audit(actor, "collection.image", "collection", target.slug, old, url);
    return false;
  }

  const found = await requirePiece(target.slug);
  const { piece } = found;
  const webp = await toWebp(bytes);
  const name = target.slot === "gallery" ? String(target.index + 1) : target.slot;
  const url = await storeImage(piece.slug, name, webp.bytes);
  let old: string | undefined;
  const images = [...piece.images];
  const media = { ...piece.media };
  if (target.slot === "gallery") {
    const image = images[target.index];
    if (!image) throw new UserError("That image isn’t there any more. Reload the page.");
    old = image.url;
    images[target.index] = { ...image, url };
  } else {
    old = media[target.slot];
    media[target.slot] = url;
  }
  await db().from("pieces").update({ images, media }).eq("id", piece.id);
  await removeImages([old], [...images.map((i) => i.url), ...Object.values(media)]);
  await audit(actor, "piece.image", "piece", piece.id, { [name]: old }, { [name]: url });
  return isLive(found);
}

/** The Fourthwall product a piece stands for: by offer id, then by slug, as orders map. */
export function matchProduct(
  products: FourthwallProduct[] | null,
  piece: Pick<PieceRow, "fourthwall_offer_id" | "fourthwall_slug">,
): FourthwallProduct | null {
  if (!products) return null;
  return (
    (piece.fourthwall_offer_id
      ? products.find((p) => p.id === piece.fourthwall_offer_id)
      : undefined) ??
    products.find((p) => p.slug === piece.fourthwall_slug) ??
    null
  );
}

export interface Check {
  label: string;
  ok: boolean;
  note?: string;
}

/** What publishing needs (required) and what it would be better with (warned). */
export async function pieceReadiness(found: PieceWithCollection) {
  const { piece, collection } = found;
  const designKey = designKeyOf(found);
  const [content, products, assets, versions, link] = await Promise.all([
    readContent(db()),
    listProducts().catch(() => null),
    listAssets(designKey),
    listContentVersions(designKey),
    resolveOffer(piece),
  ]);
  const expected = expectedVisibility(piece, collection);
  const guide = piece.size_guide_id ? content.sizeGuides[piece.size_guide_id] : undefined;
  const live = matchProduct(products, piece);
  const copy =
    versions.find((v) => v.status === "draft" || v.status === "approved") ??
    versions.find((v) => v.status === "published");
  const formats: AssetFormat[] = ["phone", "desktop"];
  const missingWallpapers = formats.filter(
    (f) => !assets.some((a) => a.format === f && a.status !== "retired"),
  );

  const required: Check[] = [
    { label: "Name", ok: piece.name.trim().length > 0 },
    { label: "Collection", ok: Boolean(collection) },
    {
      label: "Category",
      ok: content.categories.some((c) => c.slug === piece.category),
      note: piece.category,
    },
    { label: "Price", ok: piece.price_cents > 0 },
    {
      label: "Four gallery images",
      ok: piece.images.length >= 4,
      note: `${piece.images.length} now`,
    },
    {
      label: "Scripture with its King James text",
      ok: Boolean(piece.scripture.reference.trim() && piece.scripture.kjv.trim()),
    },
    { label: "Size guide", ok: Boolean(guide), note: piece.size_guide_id ?? "none chosen" },
    fourthwallCheck(link, live, products !== null, piece),
  ];
  const warned: Check[] = [
    {
      label: "Wallpapers",
      ok: missingWallpapers.length === 0,
      note: missingWallpapers.length ? `missing ${missingWallpapers.join(" and ")}` : undefined,
    },
    {
      label: "Archive copy",
      ok: Boolean(copy?.public_preview.trim() && copy.design_story.trim()),
      note: copy ? undefined : "no draft",
    },
    {
      label: "In step with Fourthwall",
      ok: link.status !== "linked" || visibilityOf(link.offer) === expected,
      note:
        link.status === "linked"
          ? `${visibilityOf(link.offer) === "PUBLIC" ? "public" : "hidden"} in Fourthwall; ${expected === "PUBLIC" ? "public" : "hidden"} to match the site`
          : undefined,
    },
  ];
  return { required, warned, live, link, expected, ready: required.every((c) => c.ok) };
}

const suggest = (link: OfferLink) =>
  "suggestion" in link && link.suggestion
    ? `; use ${link.suggestion.id} (${link.suggestion.slug})`
    : "";

/** The Fourthwall product, hidden or public, as the Platform API sees it; else the storefront. */
function fourthwallCheck(
  link: OfferLink,
  live: FourthwallProduct | null,
  storefront: boolean,
  piece: PieceRow,
): Check {
  const label = "Fourthwall product";
  switch (link.status) {
    case "linked": {
      const state = visibilityOf(link.offer) === "PUBLIC" ? "public" : "hidden";
      return { label, ok: true, note: `${link.offer.slug} (${link.offer.id}), ${state}` };
    }
    case "archived":
      return {
        label,
        ok: false,
        note: `the linked product ${link.offer.id} is archived in Fourthwall${suggest(link)}`,
      };
    case "missing":
      return {
        label,
        ok: false,
        note: `no product with offer id ${piece.fourthwall_offer_id ?? "–"} or slug ${piece.fourthwall_slug}${suggest(link)}`,
      };
    case "unavailable":
      return {
        label,
        ok: Boolean(live),
        note: live
          ? `${live.slug} (${live.id ?? "no id"}); hidden products can’t be checked: ${link.reason}`
          : storefront
            ? `not among Fourthwall’s public products, and hidden ones can’t be checked: ${link.reason}`
            : "Fourthwall isn’t reachable (or the storefront token isn’t set)",
      };
  }
}

/** Publishes a design's Archive copy and its newest wallpapers, as chosen. */
export async function applyExtras(designKey: string, extras: Extras, actor: string) {
  if (extras.archive) {
    const open = await getOpenDraft(designKey);
    if (open) {
      if (open.status === "draft") await approveDraft(designKey, actor);
      await publishContent([designKey], actor);
    }
  }
  if (extras.wallpapers) {
    const assets = await listAssets(designKey);
    for (const format of ["phone", "desktop"] as const) {
      const newest = assets.find((a) => a.format === format && a.status === "uploaded");
      if (newest) await publishAsset(newest.id, actor);
    }
  }
}

/**
 * Approve & publish. In a published release the piece goes live now with what was chosen, and its
 * Fourthwall product is made public first (nothing changes if Fourthwall refuses); in a draft
 * release it is approved and waits, and goes live with the release. A product found by slug is
 * pinned by its offer id here.
 */
export async function publishPiece(slug: string, extras: Extras, actor: string) {
  const found = await requirePiece(slug);
  const { piece, collection } = found;
  const { required, ready, link } = await pieceReadiness(found);
  if (!ready)
    throw new UserError(
      `Not ready: ${required
        .filter((c) => !c.ok)
        .map((c) => c.label.toLowerCase())
        .join(", ")}.`,
    );
  const designKey = designKeyOf(found);
  if (!(await getDesign(designKey))) throw new UserError("Its Archive design is missing.");
  const offerId = link.status === "linked" ? link.offer.id : piece.fourthwall_offer_id;
  if (offerId && offerId !== piece.fourthwall_offer_id) await mapOffer(designKey, offerId, actor);
  const now = collection.status === "published";
  const target = { slug: piece.slug, fourthwall_offer_id: offerId };
  let fourthwall: string | null = null;
  if (now) {
    const shown = await setVisibility([target], "PUBLIC");
    if (shown.failed.length)
      throw new UserError(
        `Fourthwall didn’t make the product public (${shown.failed[0]!.message}), so nothing was published. Try again.`,
      );
    fourthwall = describeVisibility(shown, "PUBLIC");
  }
  const { error } = await db()
    .from("pieces")
    .update(
      now
        ? {
            status: "published",
            published_at: new Date().toISOString(),
            released_at: collection.released_at ?? piece.released_at,
            publish_with: extras,
          }
        : { status: "in_review", publish_with: extras },
    )
    .eq("id", piece.id);
  if (error) {
    if (now) await setVisibility([target], "HIDDEN");
    throw new Error(`piece publish failed: ${error.message}`);
  }
  if (now) await applyExtras(designKey, extras, actor);
  else if (extras.archive && (await getOpenDraft(designKey))?.status === "draft")
    await approveDraft(designKey, actor);
  await audit(actor, now ? "piece.publish" : "piece.approve", "piece", piece.id, null, {
    ...extras,
    fourthwall,
  });
  return { live: now, fourthwall };
}

/**
 * Takes a piece off the site (back to draft) and hides its Fourthwall product. Its Archive copy and
 * wallpapers stay as they are. If Fourthwall refuses, the piece still comes down here.
 */
export async function unpublishPiece(slug: string, actor: string) {
  const found = await requirePiece(slug);
  const { error } = await db()
    .from("pieces")
    .update({ status: "draft", published_at: null })
    .eq("id", found.piece.id);
  if (error) throw new Error(`piece unpublish failed: ${error.message}`);
  const fourthwall = describeVisibility(await setVisibility([found.piece], "HIDDEN"), "HIDDEN");
  await audit(actor, "piece.unpublish", "piece", found.piece.id, null, { fourthwall });
  return { live: isLive(found), fourthwall };
}

/** Sets the piece's Fourthwall product to what the site expects (the "Match the site" button). */
export async function matchFourthwall(slug: string, actor: string) {
  const found = await requirePiece(slug);
  const state = expectedVisibility(found.piece, found.collection);
  const result = await setVisibility([found.piece], state);
  if (result.failed.length) throw new UserError(describeVisibility(result, state)!);
  await audit(actor, "piece.fourthwall_state", "piece", found.piece.id, null, { state });
  return describeVisibility(result, state) ?? "Nothing to change: no Fourthwall product is linked.";
}

/**
 * Deletes a piece that was never published, with everything its import made: its images, the zip
 * and reference files, its open Archive draft and unpublished wallpapers, and its Archive design
 * when nothing else holds on to it.
 */
export async function deletePieceDraft(slug: string, actor: string) {
  const found = await requirePiece(slug);
  const { piece } = found;
  if (piece.status === "published") throw new UserError("Unpublish the piece first.");
  const designKey = designKeyOf(found);
  // Its Fourthwall product is hidden, never archived: it may be reused by a new import.
  await setVisibility([piece], "HIDDEN");

  const assets = (await listAssets(designKey)).filter((a) => a.status === "uploaded");
  for (const a of assets) {
    await db().storage.from(a.storage_bucket).remove([a.storage_path]);
    await db().from("archive_assets").delete().eq("id", a.id);
  }
  await db()
    .from("archive_design_content")
    .delete()
    .eq("design_key", designKey)
    .in("status", ["draft", "approved"]);

  const { error } = await db().from("pieces").delete().eq("id", piece.id);
  if (error) throw new Error(`piece delete failed: ${error.message}`);
  await removeImages([...piece.images.map((i) => i.url), ...Object.values(piece.media)]);

  if (piece.import_id) {
    const { data: imp } = await db()
      .from("piece_imports")
      .select("zip_path, ref_paths")
      .eq("id", piece.import_id)
      .maybeSingle();
    if (imp) {
      const refs = Object.values((imp.ref_paths ?? {}) as Record<string, string>);
      await db()
        .storage.from(IMPORT_BUCKET)
        .remove([imp.zip_path as string, ...refs]);
      await db().from("piece_imports").delete().eq("id", piece.import_id);
    }
  }

  const design = await getDesign(designKey);
  const { count } = await db()
    .from("provider_order_lines")
    .select("id", { count: "exact", head: true })
    .eq("design_key", designKey);
  if (design && !design.published_content_id && !count)
    await db().from("archive_designs").delete().eq("design_key", designKey);
  await audit(actor, "piece.delete", "piece", piece.id, piece, null);
}
