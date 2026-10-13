import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { FitGuide, FitPreference } from "@/shared";
import { brandContent } from "../content";
import { UserError } from "../errors";

/**
 * Your Fit: one remembered size per garment style. A style is a size guide in catalog.json (the
 * two tee bodies, the hoodie, the two caps), so the guide a shopper sees in the shop is the one
 * their preference belongs to. The supplier's blank never leaves the server.
 */
export function listFitGuides(): FitGuide[] {
  const guides: FitGuide[] = [];
  for (const product of [...brandContent.products].sort((a, b) => a.position - b.position)) {
    const guide = product.sizeGuide;
    const id = guideIdFor(product.slug);
    if (!guide || !id || guides.some((g) => g.id === id)) continue;
    const sizes = guide.rows.map((r) => r.size);
    guides.push({
      id,
      name: guide.name,
      fit: guide.fit,
      note: guide.note,
      sizes,
      isCap: sizes.length === 1 && sizes[0] === "One size",
      guide,
    });
  }
  return guides;
}

/** The content file's guide key for a piece (products reference guides by key). */
function guideIdFor(slug: string): string | null {
  const entry = rawGuideKeys.get(slug);
  return entry ?? null;
}

// catalog.json keeps the guide key on each product; ProductContent resolves it to the guide
// object, so read the key once from the raw file for the id.
import raw from "../content/catalog.json";
const rawGuideKeys = new Map<string, string>(
  (raw as { products: { slug: string; sizeGuide?: string }[] }).products
    .filter((p) => p.sizeGuide)
    .map((p) => [p.slug, p.sizeGuide!]),
);

export function fitGuideForSlug(slug: string): FitGuide | null {
  const id = guideIdFor(slug);
  return listFitGuides().find((g) => g.id === id) ?? null;
}

export async function getFitPreferences(userId: string): Promise<FitPreference[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("fit_preferences")
    .select("size_guide_id, size, note, updated_at")
    .eq("user_id", userId);
  return (data ?? []).map((r) => {
    const row = r as {
      size_guide_id: string;
      size: string | null;
      note: string | null;
      updated_at: string;
    };
    return {
      guideId: row.size_guide_id,
      size: row.size,
      note: row.note,
      updatedAt: row.updated_at,
    };
  });
}

export async function saveFitPreference(
  userId: string,
  guideId: string,
  size: string | null,
  note: string | null,
): Promise<FitPreference> {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  const guide = listFitGuides().find((g) => g.id === guideId);
  if (!guide) throw new UserError("That guide isn’t in the shop.");
  if (guide.isCap) size = null;
  else if (!size || !guide.sizes.includes(size))
    throw new UserError("Pick one of the sizes in the guide.");
  const cleanNote = note?.trim() || null;
  const { data, error } = await supabaseAdmin
    .from("fit_preferences")
    .upsert(
      { user_id: userId, size_guide_id: guideId, size, note: cleanNote },
      { onConflict: "user_id,size_guide_id" },
    )
    .select("updated_at")
    .single();
  if (error) throw new Error(`fit save failed: ${error.message}`);
  return { guideId, size, note: cleanNote, updatedAt: (data as { updated_at: string }).updated_at };
}

export async function clearFitPreference(userId: string, guideId: string): Promise<void> {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  const { error } = await supabaseAdmin
    .from("fit_preferences")
    .delete()
    .eq("user_id", userId)
    .eq("size_guide_id", guideId);
  if (error) throw new Error(`fit clear failed: ${error.message}`);
}
