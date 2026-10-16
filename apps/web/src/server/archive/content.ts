import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DraftFields, OwnedCard, PublicCard } from "@/shared";
import { brandContent } from "../content";
import { UserError } from "../errors";
import { bibleLink } from "../scripture";
import { assetsForOwnedCard } from "./assets";
import { audit } from "./audit";
import { getDesign, getDesignBySlug, listDesigns } from "./designs";
import { getEntitlement } from "./entitlements";
import { getArchiveReadiness } from "./readiness";
import type { ContentRow, DesignRow } from "./types";

/**
 * Two serializers, two responses. The public card is what any visitor may read (the published
 * preview and Scripture context); the owned card adds the full story, imagery, founder note, care
 * and extras, and exists only for an account with an entitlement to the design.
 */

function admin() {
  if (!supabaseAdmin) throw new Error("database not configured");
  return supabaseAdmin;
}

const collectionName = (slug: string) =>
  brandContent.collections.find((c) => c.slug === slug)?.name ?? slug;

async function publishedContent(design: DesignRow): Promise<ContentRow | null> {
  if (!supabaseAdmin || !design.published_content_id) return null;
  const { data } = await supabaseAdmin
    .from("archive_design_content")
    .select("*")
    .eq("id", design.published_content_id)
    .eq("status", "published")
    .maybeSingle();
  return (data as ContentRow | null) ?? null;
}

function toPublicCard(design: DesignRow, content: ContentRow): PublicCard {
  return {
    designKey: design.design_key,
    slug: design.product_slug,
    name: design.name,
    collection: { slug: design.collection_slug, name: collectionName(design.collection_slug) },
    scriptureReference: design.scripture_reference,
    contextReference: content.context_reference,
    bibleUrl: bibleLink(content.bible_url),
    additionalBibleUrls: content.additional_bible_urls.map(bibleLink),
    publicPreview: content.public_preview,
    biblicalContext: content.biblical_context,
    publishedAt: content.published_at ?? content.updated_at,
  };
}

export async function getPublishedPublicCard(slug: string): Promise<PublicCard | null> {
  const design = await getDesignBySlug(slug);
  if (!design) return null;
  const content = await publishedContent(design);
  return content ? toPublicCard(design, content) : null;
}

export async function listPublishedPublicCards(): Promise<PublicCard[]> {
  const cards: PublicCard[] = [];
  for (const design of await listDesigns()) {
    const content = await publishedContent(design);
    if (content) cards.push(toPublicCard(design, content));
  }
  return cards;
}

/** Null unless the account owns the design and its content is published. */
export async function getOwnedCard(userId: string, slug: string): Promise<OwnedCard | null> {
  const design = await getDesignBySlug(slug);
  if (!design) return null;
  const [content, entitlement] = await Promise.all([
    publishedContent(design),
    getEntitlement(userId, design.design_key),
  ]);
  if (!content || !entitlement) return null;
  const [extras, readiness] = await Promise.all([
    assetsForOwnedCard(design.design_key),
    getArchiveReadiness(),
  ]);
  return {
    ...toPublicCard(design, content),
    designStory: content.design_story,
    imageryMeaning: content.imagery_meaning,
    founderNote: content.founder_note,
    care:
      content.care_status === "verified" && content.care_instructions
        ? { status: "verified", instructions: content.care_instructions }
        : { status: "unconfirmed" },
    entitlement: {
      quantity: entitlement.quantity,
      firstPaidAt: entitlement.firstPaidAt,
      variants: entitlement.variants,
    },
    extras: readiness.wallpapers ? extras : [],
    exports: { pdf: readiness.pdf, share: readiness.share },
    shareCopy: content.share_copy,
  };
}

/** The published design and content a render reads (the caller has already checked the entitlement). */
export async function getPublishedForExport(
  slug: string,
): Promise<{ design: DesignRow; content: ContentRow } | null> {
  const design = await getDesignBySlug(slug);
  if (!design) return null;
  const content = await publishedContent(design);
  return content ? { design, content } : null;
}

// Owner workflow

export interface ContentStatus {
  design: DesignRow;
  latest: ContentRow | null;
  published: ContentRow | null;
}

export async function listContentStatus(): Promise<ContentStatus[]> {
  const designs = await listDesigns();
  if (designs.length === 0) return [];
  const { data } = await admin()
    .from("archive_design_content")
    .select("*")
    .order("version", { ascending: false });
  const rows = (data ?? []) as ContentRow[];
  return designs.map((design) => ({
    design,
    latest: rows.find((r) => r.design_key === design.design_key) ?? null,
    published:
      rows.find((r) => r.design_key === design.design_key && r.status === "published") ?? null,
  }));
}

export async function listContentVersions(designKey: string): Promise<ContentRow[]> {
  const { data } = await admin()
    .from("archive_design_content")
    .select("*")
    .eq("design_key", designKey)
    .order("version", { ascending: false });
  return (data ?? []) as ContentRow[];
}

/** The draft or approved row the owner is working on, if any. */
export async function getOpenDraft(designKey: string): Promise<ContentRow | null> {
  const { data } = await admin()
    .from("archive_design_content")
    .select("*")
    .eq("design_key", designKey)
    .in("status", ["draft", "approved"])
    .maybeSingle();
  return (data as ContentRow | null) ?? null;
}

/** A stored version as the editor's fields. */
export const rowToFields = (row: ContentRow): DraftFields => ({
  publicPreview: row.public_preview,
  biblicalContext: row.biblical_context,
  contextReference: row.context_reference,
  bibleUrl: row.bible_url,
  additionalBibleUrls: row.additional_bible_urls,
  designStory: row.design_story,
  imageryMeaning: row.imagery_meaning,
  founderNote: row.founder_note,
  shareCopy: row.share_copy,
  notes: row.notes ?? "",
});

const fieldColumns = (f: DraftFields) => ({
  public_preview: f.publicPreview,
  biblical_context: f.biblicalContext,
  context_reference: f.contextReference,
  bible_url: f.bibleUrl,
  additional_bible_urls: f.additionalBibleUrls,
  design_story: f.designStory,
  imagery_meaning: f.imageryMeaning,
  founder_note: f.founderNote,
  share_copy: f.shareCopy,
  notes: f.notes || null,
});

/** Edits the open draft, or starts the next version from the published row. Any edit needs a new approval. */
export async function saveDraft(
  designKey: string,
  fields: DraftFields,
  actor: string,
): Promise<ContentRow> {
  const design = await getDesign(designKey);
  if (!design) throw new UserError("Unknown design.");
  const open = await getOpenDraft(designKey);
  const reset = {
    status: "draft",
    approved_by: null,
    approved_at: null,
    founder_note_proposed: true,
  };
  if (open) {
    const { data, error } = await admin()
      .from("archive_design_content")
      .update({ ...fieldColumns(fields), ...reset })
      .eq("id", open.id)
      .select("*")
      .single();
    if (error) throw new Error(`draft save failed: ${error.message}`);
    await audit(actor, "content.save_draft", "content", open.id, open, data);
    return data as ContentRow;
  }
  const versions = await listContentVersions(designKey);
  const published = versions.find((v) => v.status === "published");
  const next = (versions[0]?.version ?? 0) + 1;
  const { data, error } = await admin()
    .from("archive_design_content")
    .insert({
      design_key: designKey,
      version: next,
      ...fieldColumns(fields),
      care_status: published?.care_status ?? "unconfirmed",
      care_instructions: published?.care_instructions ?? null,
      care_source: published?.care_source ?? null,
      care_verified_at: published?.care_verified_at ?? null,
      care_verified_by: published?.care_verified_by ?? null,
      created_by: actor,
      ...reset,
    })
    .select("*")
    .single();
  if (error) throw new Error(`draft create failed: ${error.message}`);
  await audit(actor, "content.create_draft", "content", (data as ContentRow).id, null, data);
  return data as ContentRow;
}

/** The owner confirms the wording, including the founder note as his own. */
export async function approveDraft(designKey: string, actor: string): Promise<void> {
  const open = await getOpenDraft(designKey);
  if (!open) throw new UserError("There is no draft to approve.");
  const { error } = await admin()
    .from("archive_design_content")
    .update({
      status: "approved",
      approved_by: actor,
      approved_at: new Date().toISOString(),
      founder_note_proposed: false,
    })
    .eq("id", open.id);
  if (error) throw new Error(`approve failed: ${error.message}`);
  await audit(
    actor,
    "content.approve",
    "content",
    open.id,
    { status: open.status },
    { status: "approved" },
  );
}

/** Publishes approved drafts, one or several. Stops at the first design that isn't approved. */
export async function publishContent(designKeys: string[], actor: string): Promise<string[]> {
  const published: string[] = [];
  for (const designKey of designKeys) {
    const design = await getDesign(designKey);
    if (!design) throw new UserError("Unknown design.");
    const open = await getOpenDraft(designKey);
    if (!open || open.status !== "approved")
      throw new UserError(`${design.name} isn’t approved yet.`);
    const now = new Date().toISOString();
    if (design.published_content_id) {
      const { error } = await admin()
        .from("archive_design_content")
        .update({ status: "retired", retired_at: now })
        .eq("id", design.published_content_id);
      if (error) throw new Error(`retire failed: ${error.message}`);
    }
    const { error } = await admin()
      .from("archive_design_content")
      .update({ status: "published", published_by: actor, published_at: now })
      .eq("id", open.id);
    if (error) throw new Error(`publish failed: ${error.message}`);
    const { error: pointer } = await admin()
      .from("archive_designs")
      .update({ published_content_id: open.id })
      .eq("design_key", designKey);
    if (pointer) throw new Error(`publish pointer failed: ${pointer.message}`);
    await audit(
      actor,
      "content.publish",
      "content",
      open.id,
      { previous: design.published_content_id },
      { version: open.version },
    );
    published.push(designKey);
  }
  return published;
}

export async function retireContent(designKey: string, actor: string): Promise<void> {
  const design = await getDesign(designKey);
  if (!design?.published_content_id) throw new UserError("Nothing is published for this design.");
  const { error } = await admin()
    .from("archive_design_content")
    .update({ status: "retired", retired_at: new Date().toISOString() })
    .eq("id", design.published_content_id);
  if (error) throw new Error(`retire failed: ${error.message}`);
  await admin()
    .from("archive_designs")
    .update({ published_content_id: null })
    .eq("design_key", designKey);
  await audit(
    actor,
    "content.retire",
    "content",
    design.published_content_id,
    { published: true },
    { published: false },
  );
}

/** Care comes from the owner's verification (the provider's product details), never guessed. */
export async function verifyCare(
  designKey: string,
  instructions: string,
  source: string,
  actor: string,
): Promise<void> {
  const design = await getDesign(designKey);
  if (!design) throw new UserError("Unknown design.");
  const target =
    (await getOpenDraft(designKey)) ??
    (design.published_content_id ? await publishedContent(design) : null);
  if (!target) throw new UserError("Import or create a draft first.");
  const { error } = await admin()
    .from("archive_design_content")
    .update({
      care_status: "verified",
      care_instructions: instructions,
      care_source: source,
      care_verified_at: new Date().toISOString(),
      care_verified_by: actor,
    })
    .eq("id", target.id);
  if (error) throw new Error(`care update failed: ${error.message}`);
  await audit(
    actor,
    "content.verify_care",
    "content",
    target.id,
    { care_status: target.care_status },
    { care_status: "verified", source },
  );
}
