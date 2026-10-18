import "server-only";
import type { CollectionFields } from "@/shared/pieces";
import { audit } from "../archive/audit";
import { designKeyFor } from "../archive/designs";
import { UserError } from "../errors";
import { applyExtras } from "./pieces";
import { db } from "./storage";
import type { CollectionRow, PieceRow } from "./types";

/** Releases as the owner manages them: draft until published, and then the newest is Latest Drop. */

export async function listCollections(): Promise<(CollectionRow & { pieces: number })[]> {
  const { data, error } = await db()
    .from("collections")
    .select("*, pieces(count)")
    .order("position")
    .order("created_at");
  if (error) throw new Error(`collections read failed: ${error.message}`);
  return ((data ?? []) as (CollectionRow & { pieces: { count: number }[] })[]).map((c) => ({
    ...c,
    pieces: c.pieces[0]?.count ?? 0,
  }));
}

export async function getCollection(slug: string): Promise<CollectionRow | null> {
  const { data } = await db().from("collections").select("*").eq("slug", slug).maybeSingle();
  return (data as CollectionRow | null) ?? null;
}

export async function requireCollection(slug: string): Promise<CollectionRow> {
  const collection = await getCollection(slug);
  if (!collection) throw new UserError("That collection doesn’t exist.");
  return collection;
}

export async function collectionPieces(id: string): Promise<PieceRow[]> {
  const { data, error } = await db()
    .from("pieces")
    .select("*")
    .eq("collection_id", id)
    .order("position");
  if (error) throw new Error(`pieces read failed: ${error.message}`);
  return (data ?? []) as PieceRow[];
}

const columns = (f: CollectionFields) => ({
  slug: f.slug,
  name: f.name,
  number: f.number,
  tagline: f.tagline,
  story: f.story,
  scripture_ref: f.scriptureRef,
  released_at: f.releasedAt || null,
  position: f.position,
});

/** Creates a collection (as a draft) or saves one. Returns the row and whether it is live. */
export async function saveCollection(
  slug: string | null,
  fields: CollectionFields,
  actor: string,
): Promise<CollectionRow> {
  const before = slug ? await requireCollection(slug) : null;
  if (before && fields.slug !== before.slug && (await collectionPieces(before.id)).length > 0)
    throw new UserError(
      "A collection with pieces keeps its slug: it is part of each piece’s Archive record.",
    );
  const query = before
    ? db().from("collections").update(columns(fields)).eq("id", before.id)
    : db().from("collections").insert(columns(fields));
  const { data, error } = await query.select("*").single();
  if (error?.code === "23505") throw new UserError("Another collection has that slug.");
  if (error) throw new Error(`collection save failed: ${error.message}`);
  const row = data as CollectionRow;
  // A live release's pieces carry its date (the shop sorts by release, then position).
  if (row.status === "published" && row.released_at && row.released_at !== before?.released_at)
    await db().from("pieces").update({ released_at: row.released_at }).eq("collection_id", row.id);
  await audit(
    actor,
    before ? "collection.save" : "collection.create",
    "collection",
    row.id,
    before,
    row,
  );
  return row;
}

/**
 * Puts a release live with its approved pieces, and what each was approved with (Archive copy,
 * wallpapers). Returns the pieces that went live now.
 */
export async function publishCollection(slug: string, actor: string): Promise<string[]> {
  const collection = await requireCollection(slug);
  const { data, error } = await db().rpc("catalog_publish_collection", { p_id: collection.id });
  if (error) throw new Error(`collection publish failed: ${error.message}`);
  const ids = ((data ?? []) as string[]).map(String);
  const pieces = (await collectionPieces(collection.id)).filter((p) => ids.includes(p.id));
  for (const piece of pieces)
    await applyExtras(designKeyFor(collection.slug, piece.slug), piece.publish_with, actor);
  await audit(actor, "collection.publish", "collection", collection.id, null, {
    pieces: pieces.map((p) => p.slug),
  });
  return pieces.map((p) => p.slug);
}

/** Takes a release off the site with all its pieces; they keep their status for next time. */
export async function unpublishCollection(slug: string, actor: string) {
  const collection = await requireCollection(slug);
  const { error } = await db()
    .from("collections")
    .update({ status: "draft" })
    .eq("id", collection.id);
  if (error) throw new Error(`collection unpublish failed: ${error.message}`);
  await audit(actor, "collection.unpublish", "collection", collection.id, null, null);
}

/** Sets the pieces' order within the release, from 1, on the pieces and their Archive designs. */
export async function reorderPieces(slug: string, order: string[], actor: string) {
  const collection = await requireCollection(slug);
  const pieces = await collectionPieces(collection.id);
  if (order.length !== pieces.length || pieces.some((p) => !order.includes(p.slug)))
    throw new UserError("The list changed. Reload the page and try again.");
  for (const [i, s] of order.entries()) {
    await db()
      .from("pieces")
      .update({ position: i + 1 })
      .eq("slug", s);
    await db()
      .from("archive_designs")
      .update({ position: i + 1 })
      .eq("design_key", designKeyFor(collection.slug, s));
  }
  await audit(actor, "collection.reorder", "collection", collection.id, null, { order });
  return collection.status === "published";
}
