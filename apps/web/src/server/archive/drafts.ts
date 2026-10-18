import "server-only";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBrandContent } from "../content";
import raw from "../content/archive-drafts.json";
import { audit } from "./audit";
import { designKeyFor, upsertDesigns } from "./designs";

/**
 * The ten editorial drafts Richard received on October 12, 2026, committed as server-only seed
 * material. They enter the database as unpublished drafts; nothing here publishes them.
 */

/** One design's editorial draft, as archive-drafts.json and a piece zip's content.json hold it. */
export const DraftSchema = z.object({
  design_key: z.string(),
  catalog_code: z.string(),
  catalog_slug: z.string(),
  name: z.string(),
  collection: z.string(),
  category: z.string(),
  scripture_reference: z.string(),
  context_reference: z.string(),
  bible_url: z.string(),
  additional_bible_urls: z.array(z.string()).optional(),
  public_preview: z.string(),
  biblical_context: z.string(),
  design_story: z.string(),
  imagery_meaning: z.string(),
  founder_note: z.string(),
  share_copy: z.string(),
  care: z.object({ status: z.string(), instructions: z.string().nullable() }).optional(),
});
const DraftsFileSchema = z.object({ prepared_on: z.string(), designs: z.array(DraftSchema) });
export type Draft = z.infer<typeof DraftSchema>;

export const drafts = DraftsFileSchema.parse(raw);

export interface DraftCheck {
  slug: string;
  designKey: string;
  problems: string[];
}

const plain = (s: string) => s.replace(/[’‘]/g, "'").trim().toLowerCase();

/** Every draft must describe a piece exactly as the catalog does; a similar name proves nothing. */
export async function validateDraftsAgainstCatalog(): Promise<DraftCheck[]> {
  const { products } = await getBrandContent();
  return drafts.designs.map((d) => {
    const problems: string[] = [];
    const product = products.find((p) => p.slug === d.catalog_slug);
    if (!product)
      return {
        slug: d.catalog_slug,
        designKey: d.design_key,
        problems: ["no such piece in the catalog"],
      };
    if (plain(product.name) !== plain(d.name))
      problems.push(`name differs: catalog has "${product.name}"`);
    if (product.scripture.reference !== d.scripture_reference)
      problems.push(`Scripture differs: catalog has ${product.scripture.reference}`);
    if (product.code !== d.catalog_code) problems.push("catalog code differs");
    if (plain(product.category.cut) !== plain(d.category))
      problems.push(`garment differs: catalog has ${product.category.cut}`);
    if (plain(product.collection.name) !== plain(d.collection))
      problems.push(`collection differs: catalog has ${product.collection.name}`);
    if (designKeyFor(product.collection.slug, product.slug) !== d.design_key)
      problems.push("design key differs");
    return { slug: d.catalog_slug, designKey: d.design_key, problems };
  });
}

export interface ImportReport {
  inserted: string[];
  skipped: string[];
  mismatches: DraftCheck[];
}

/** Inserts a design's version 1 draft. The founder note stays proposed until the owner approves it. */
export async function insertDraft(d: Draft, actor: string | null, notes: string) {
  if (!supabaseAdmin) throw new Error("database not configured");
  const { error } = await supabaseAdmin.from("archive_design_content").insert({
    design_key: d.design_key,
    version: 1,
    status: "draft",
    public_preview: d.public_preview,
    biblical_context: d.biblical_context,
    context_reference: d.context_reference,
    bible_url: d.bible_url,
    additional_bible_urls: d.additional_bible_urls ?? [],
    design_story: d.design_story,
    imagery_meaning: d.imagery_meaning,
    founder_note: d.founder_note,
    founder_note_proposed: true,
    share_copy: d.share_copy,
    care_status: "unconfirmed",
    care_instructions: d.care?.instructions ?? null,
    notes,
    created_by: actor,
  });
  if (error) throw new Error(`draft insert failed for ${d.design_key}: ${error.message}`);
}

/** Inserts version 1 drafts for designs that have no content yet. Idempotent and draft-only. */
export async function importDrafts(actor: string | null): Promise<ImportReport> {
  if (!supabaseAdmin) throw new Error("database not configured");
  await upsertDesigns((await getBrandContent()).products);
  const mismatches = (await validateDraftsAgainstCatalog()).filter((c) => c.problems.length > 0);
  const { data: existing, error } = await supabaseAdmin
    .from("archive_design_content")
    .select("design_key");
  if (error) throw new Error(`content read failed: ${error.message}`);
  const has = new Set((existing ?? []).map((r) => (r as { design_key: string }).design_key));
  const inserted: string[] = [];
  const skipped: string[] = [];
  for (const d of drafts.designs) {
    if (mismatches.some((m) => m.designKey === d.design_key) || has.has(d.design_key)) {
      skipped.push(d.design_key);
      continue;
    }
    await insertDraft(
      d,
      actor,
      `Imported from the content drafts prepared ${drafts.prepared_on}. The founder note is proposed wording for Richard's review.`,
    );
    inserted.push(d.design_key);
  }
  await audit(actor, "content.import_drafts", "content", null, null, {
    inserted,
    skipped: skipped.length,
    mismatches: mismatches.length,
  });
  return { inserted, skipped, mismatches };
}
