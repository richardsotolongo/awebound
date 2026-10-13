import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { pieceStatus } from "@/features/catalog/query";
import type { SavedPiece } from "@/shared";
import { getCatalog } from "../catalog";
import { toSummary } from "../catalog-search";
import { UserError } from "../errors";

function admin() {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  return supabaseAdmin;
}

export async function savedSlugs(userId: string): Promise<string[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("saved_pieces")
    .select("product_slug")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => (r as { product_slug: string }).product_slug);
}

/** Saved pieces with what the catalog knows about them today; a piece that left the catalog stays listed. */
export async function listSavedPieces(userId: string): Promise<SavedPiece[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("saved_pieces")
    .select("product_slug, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as { product_slug: string; created_at: string }[];
  if (rows.length === 0) return [];
  const catalog = await getCatalog();
  return rows.map((row) => {
    const product = catalog.findBySlug(row.product_slug);
    if (!product) return { slug: row.product_slug, savedAt: row.created_at, piece: null };
    const summary = toSummary(product);
    return {
      slug: row.product_slug,
      savedAt: row.created_at,
      piece: {
        name: summary.name,
        cut: summary.category.cut,
        color: summary.baseColor,
        image: { url: summary.image.url, alt: summary.image.alt },
        status: pieceStatus(summary) ?? null,
      },
    };
  });
}

export async function savePiece(userId: string, slug: string): Promise<void> {
  const catalog = await getCatalog();
  if (!catalog.findBySlug(slug)) throw new UserError("That piece isn’t in the shop.");
  const { error } = await admin()
    .from("saved_pieces")
    .upsert({ user_id: userId, product_slug: slug }, { onConflict: "user_id,product_slug", ignoreDuplicates: true });
  if (error) throw new Error(`save failed: ${error.message}`);
}

export async function unsavePiece(userId: string, slug: string): Promise<void> {
  const { error } = await admin().from("saved_pieces").delete().eq("user_id", userId).eq("product_slug", slug);
  if (error) throw new Error(`unsave failed: ${error.message}`);
}
