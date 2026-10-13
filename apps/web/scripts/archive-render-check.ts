/**
 * Renders the design card PDF and both story images for one piece straight from the committed
 * drafts (no database), so the exports can be checked by eye before anything is published.
 * Usage: pnpm --filter @awebound/web archive:render-check -- <product-slug> [--out <dir>]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { arg } from "./_env";

const slug = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "thorns-to-lilies";
const out = arg("--out") ?? join(process.cwd(), ".render-check");

const { drafts } = await import("../src/server/archive/drafts");
const { brandContent } = await import("../src/server/content");
const { renderDesignCardPdf } = await import("../src/server/archive/pdf");
const { renderShareImage } = await import("../src/server/archive/share");
const { readImageHeader } = await import("../src/server/archive/assets");
const { getCatalog } = await import("../src/server/catalog");

const draft = drafts.designs.find((d) => d.catalog_slug === slug);
const content = brandContent.products.find((p) => p.slug === slug);
if (!draft || !content) {
  console.error(`No draft or catalog entry for ${slug}.`);
  process.exit(1);
}
const product = (await getCatalog()).findBySlug(slug);
if (!product) {
  console.error(`The catalog has no product ${slug}.`);
  process.exit(1);
}
const now = new Date().toISOString();
const design = {
  design_key: draft.design_key, product_slug: slug, collection_slug: content.collection.slug, name: content.name,
  scripture_reference: content.scripture.reference, fourthwall_slug: content.fourthwallSlug, fourthwall_offer_id: null,
  position: content.position, published_content_id: "check", created_at: now, updated_at: now,
};
const row = {
  id: "check", design_key: draft.design_key, version: 1, status: "published" as const,
  public_preview: draft.public_preview, biblical_context: draft.biblical_context, context_reference: draft.context_reference,
  bible_url: draft.bible_url, additional_bible_urls: draft.additional_bible_urls ?? [], design_story: draft.design_story,
  imagery_meaning: draft.imagery_meaning, founder_note: draft.founder_note, founder_note_proposed: false, share_copy: draft.share_copy,
  care_status: "unconfirmed" as const, care_instructions: null, care_source: null, care_verified_at: null, care_verified_by: null,
  notes: null, created_by: null, created_at: now, updated_at: now, approved_by: null, approved_at: now, published_by: null,
  published_at: now, retired_at: null,
};
await mkdir(out, { recursive: true });
const pdf = await renderDesignCardPdf(design, row, product);
await writeFile(join(out, `${slug}-design-card.pdf`), pdf);
console.info(`pdf: ${pdf.length} bytes, header ${Buffer.from(pdf.subarray(0, 5)).toString()}`);
for (const format of ["portrait", "square"] as const) {
  const png = await renderShareImage(design, row, product, format);
  await writeFile(join(out, `${slug}-story-${format}.png`), png);
  const header = readImageHeader(Buffer.from(png));
  console.info(`${format}: ${png.length} bytes, ${header?.mime} ${header?.width} x ${header?.height}`);
}
console.info(`written to ${out}`);
