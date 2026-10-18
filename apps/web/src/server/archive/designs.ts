import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { audit } from "./audit";
import type { DesignRow } from "./types";

/** One Archive design per piece in the content file, keyed `${collection}:${slug}`. */
export const designKeyFor = (collectionSlug: string, productSlug: string) =>
  `${collectionSlug}:${productSlug}`;

function admin() {
  if (!supabaseAdmin) throw new Error("database not configured");
  return supabaseAdmin;
}

export async function listDesigns(): Promise<DesignRow[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.from("archive_designs").select("*").order("position");
  if (error) throw new Error(`designs read failed: ${error.message}`);
  return (data ?? []) as DesignRow[];
}

export async function getDesignBySlug(slug: string): Promise<DesignRow | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("archive_designs")
    .select("*")
    .eq("product_slug", slug)
    .maybeSingle();
  return (data as DesignRow | null) ?? null;
}

export async function getDesign(designKey: string): Promise<DesignRow | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("archive_designs")
    .select("*")
    .eq("design_key", designKey)
    .maybeSingle();
  return (data as DesignRow | null) ?? null;
}

/**
 * Creates or refreshes the design rows from the catalog's pieces (name, Scripture reference,
 * Fourthwall slug, position), so a rename shows in My Archive too. Idempotent; never touches the
 * offer id or the published content pointer.
 */
export async function upsertDesigns(
  products: {
    slug: string;
    name: string;
    fourthwallSlug: string;
    position: number;
    collection: { slug: string };
    scripture: { reference: string };
  }[],
): Promise<number> {
  const rows = products.map((p) => ({
    design_key: designKeyFor(p.collection.slug, p.slug),
    product_slug: p.slug,
    collection_slug: p.collection.slug,
    name: p.name,
    scripture_reference: p.scripture.reference,
    fourthwall_slug: p.fourthwallSlug,
    position: p.position,
  }));
  const { error } = await admin()
    .from("archive_designs")
    .upsert(rows, { onConflict: "design_key" });
  if (error) throw new Error(`designs upsert failed: ${error.message}`);
  return rows.length;
}

/**
 * Pins the Fourthwall offer id a design's orders arrive under (seen on the first order, or set by
 * the owner), on the design and on its piece in the catalog.
 */
export async function mapOffer(designKey: string, offerId: string, actor: string | null) {
  const before = await getDesign(designKey);
  const { error } = await admin()
    .from("archive_designs")
    .update({ fourthwall_offer_id: offerId })
    .eq("design_key", designKey);
  if (error) throw new Error(`offer mapping failed: ${error.message}`);
  if (before) {
    const { error: pieceError } = await admin()
      .from("pieces")
      .update({ fourthwall_offer_id: offerId })
      .eq("slug", before.product_slug);
    if (pieceError) throw new Error(`offer mapping failed: ${pieceError.message}`);
  }
  await audit(
    actor,
    "design.map_offer",
    "design",
    designKey,
    { offerId: before?.fourthwall_offer_id ?? null },
    { offerId },
  );
}
