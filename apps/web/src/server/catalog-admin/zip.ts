import "server-only";
import { randomUUID } from "node:crypto";
import { PLATE_HEX } from "@awebound/brand/hex";
import { z } from "zod";
import { unmeasured } from "@/components/fit-name";
import { CollectionSchema, DraftFieldsSchema, type AssetFormat } from "@/shared";
import {
  PieceJsonSchema,
  SizeGuideContentSchema,
  SlugSchema,
  type ImportCollection,
  type PieceJson,
  type SizeGuideContent,
  type ZipReport,
} from "@/shared/pieces";
import { unpackZip, zipJson } from "@/shared/piece-zip";
import { ingestAsset, readImageHeader } from "../archive/assets";
import { audit } from "../archive/audit";
import { designKeyFor, mapOffer, upsertDesigns } from "../archive/designs";
import { DraftSchema, insertDraft, type Draft } from "../archive/drafts";
import { checkPiece, readContent } from "../content";
import { UserError } from "../errors";
import { getCollection, saveCollection } from "./collections";
import { db, IMPORT_BUCKET, imageSize, sampleSwatch, storeImage, toWebp } from "./storage";
import type { CollectionRow, ImportRow } from "./types";

/**
 * One zip, one garment (made by the awebound-new-piece skill): piece.json, content.json, the site's
 * images and the wallpapers, with an optional new collection and size guide. It is checked as a
 * whole, then everything it holds is created as drafts for the owner's review.
 */

const GALLERY = { width: 1000, height: 1250 };
const MEDIA = {
  detail: "images/detail.webp",
  piece: "images/piece.webp",
  plateWide: "images/plate-wide.webp",
  plateTall: "images/plate-tall.webp",
} as const;
const WALLPAPERS: Record<AssetFormat, { width: number; height: number; title: string }> = {
  phone: { width: 1290, height: 2796, title: "Phone wallpaper" },
  desktop: { width: 3840, height: 2160, title: "Desktop wallpaper" },
};
/** The archive-assets bucket's limit. */
const WALLPAPER_MAX_BYTES = 50 * 1024 * 1024;

const GuideFileSchema = z.record(SlugSchema, SizeGuideContentSchema);

/** A new import: its row, and a one-time address the browser uploads the zip to. */
export async function createImport(fileName: string, actor: string) {
  const id = randomUUID();
  const path = `${id}/${fileName}`;
  const { data, error } = await db().storage.from(IMPORT_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`upload target failed: ${error?.message}`);
  const { error: insertError } = await db()
    .from("piece_imports")
    .insert({ id, zip_path: path, file_name: fileName, created_by: actor });
  if (insertError) throw new Error(`import insert failed: ${insertError.message}`);
  return { importId: id, bucket: IMPORT_BUCKET, path, token: data.token };
}

async function loadImport(importId: string) {
  const { data } = await db().from("piece_imports").select("*").eq("id", importId).maybeSingle();
  if (!data) throw new UserError("That import doesn’t exist. Upload the zip again.");
  const row = data as ImportRow;
  const { data: blob, error } = await db().storage.from(IMPORT_BUCKET).download(row.zip_path);
  if (error || !blob) throw new UserError("The zip didn’t arrive. Upload it again.");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  try {
    return { row, bytes: bytes.length, files: unpackZip(bytes) };
  } catch {
    throw new UserError("That file isn’t a zip that can be read.");
  }
}

const issues = (file: string, error: z.ZodError) =>
  error.issues.slice(0, 6).map((i) => `${file}: ${i.path.join(".") || "file"}: ${i.message}`);

/** The words before a model number: "AS Colour 5052 …" names AS Colour. */
function supplierNames(blanks: string[]): string[] {
  const names = new Set(["Fourthwall"]);
  for (const blank of blanks) {
    const words = blank.split(/\s+/);
    const end = words.findIndex((w) => /\d/.test(w));
    const brand = words.slice(0, end === -1 ? 2 : end).join(" ");
    if (brand.length >= 3) names.add(brand);
    if (words[0] && words[0].length >= 4) names.add(words[0]);
  }
  return [...names];
}

interface Checked {
  report: ZipReport;
  piece: PieceJson | null;
  draft: Draft | null;
  /** A size guide the zip brings that isn't in the database yet. */
  guide: [string, SizeGuideContent] | null;
  collection: CollectionRow | null;
}

async function checkFiles(
  files: Record<string, Uint8Array>,
  choice: ImportCollection,
): Promise<Checked> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const has = (name: string) => Boolean(files[name]);

  const pieceRaw = zipJson(files, "piece.json");
  const parsed = PieceJsonSchema.safeParse(pieceRaw);
  if (!pieceRaw) errors.push("piece.json is missing or isn’t JSON.");
  else if (!parsed.success) errors.push(...issues("piece.json", parsed.error));
  const piece = parsed.success ? parsed.data : null;

  // The collection it goes in.
  const target = "existing" in choice ? choice.existing : choice.create.slug;
  const collection = await getCollection(target);
  if ("existing" in choice && !collection) errors.push(`There is no collection ${target}.`);
  if ("create" in choice) {
    if (collection)
      errors.push(`A collection with the slug ${target} already exists: choose it instead.`);
    const missing = unmeasured(choice.create.name);
    if (missing.length)
      warnings.push(
        `The collection name uses ${missing.join(" ")}, which the release lettering hasn’t measured: it sets a little short until WIDTHS in components/fit-name.tsx has it.`,
      );
  }
  if (piece && piece.collection !== target)
    warnings.push(`piece.json names the collection ${piece.collection}; it goes in ${target}.`);
  if (
    has("collection.json") &&
    !CollectionSchema.safeParse(zipJson(files, "collection.json")).success
  )
    warnings.push("collection.json can’t be read, so it was left out.");

  // The Archive copy.
  const draftRaw = zipJson(files, "content.json");
  const draftParsed = DraftSchema.safeParse(draftRaw);
  if (!draftRaw) errors.push("content.json is missing or isn’t JSON.");
  else if (!draftParsed.success) errors.push(...issues("content.json", draftParsed.error));
  const draft = draftParsed.success ? draftParsed.data : null;
  if (draft && piece) {
    if (draft.catalog_slug !== piece.slug)
      errors.push(`content.json is for ${draft.catalog_slug}, not ${piece.slug}.`);
    if (draft.design_key !== designKeyFor(target, piece.slug))
      warnings.push(
        `content.json’s design key is ${draft.design_key}; it is stored as ${designKeyFor(target, piece.slug)}.`,
      );
    if (draft.scripture_reference !== piece.scripture.reference)
      warnings.push(
        `content.json quotes ${draft.scripture_reference}; piece.json quotes ${piece.scripture.reference}.`,
      );
    const fields = DraftFieldsSchema.safeParse({
      publicPreview: draft.public_preview,
      biblicalContext: draft.biblical_context,
      contextReference: draft.context_reference,
      bibleUrl: draft.bible_url,
      additionalBibleUrls: draft.additional_bible_urls ?? [],
      designStory: draft.design_story,
      imageryMeaning: draft.imagery_meaning,
      founderNote: draft.founder_note,
      shareCopy: draft.share_copy,
      notes: "",
    });
    if (!fields.success) errors.push(...issues("content.json", fields.error));
  }

  // The size guide.
  const { data: guideRows } = await db().from("size_guides").select("id, blank");
  const known = new Set((guideRows ?? []).map((g) => g.id as string));
  let guide: [string, SizeGuideContent] | null = null;
  if (has("size-guide.json")) {
    const g = GuideFileSchema.safeParse(zipJson(files, "size-guide.json"));
    const entries = g.success ? Object.entries(g.data) : [];
    if (!g.success) errors.push(...issues("size-guide.json", g.error));
    else if (entries.length !== 1) errors.push("size-guide.json holds one guide, keyed by its id.");
    else {
      const [id, value] = entries[0]!;
      const bad = value.rows.find((r) => r.values.length !== value.measures.length);
      if (bad) errors.push(`size-guide.json: ${bad.size} needs ${value.measures.length} values.`);
      if (known.has(id))
        warnings.push(`The size guide ${id} exists already, so it is kept as it is.`);
      else guide = [id, value];
    }
    if (has("size-guide.png")) {
      const size = await imageSize(files["size-guide.png"]!);
      if (!size) errors.push("size-guide.png isn’t an image.");
      else if (size.width !== 3200)
        warnings.push(`size-guide.png is ${size.width} px wide; expected 3200.`);
    } else if (guide) warnings.push("No size-guide.png: the guide shows its table.");
  }
  if (piece) {
    if (!piece.sizeGuide) warnings.push("No size guide: choose one before publishing.");
    else if (!known.has(piece.sizeGuide) && guide?.[0] !== piece.sizeGuide)
      errors.push(`The size guide ${piece.sizeGuide} isn’t in the database or the zip.`);
  }

  // Uniqueness, and the piece as the site would read it.
  if (piece) {
    const fourthwallSlug = piece.fourthwallSlug ?? piece.slug;
    const taken = async (table: string, column: string, value: string) =>
      (await db().from(table).select("*").eq(column, value).limit(1)).data?.[0] as
        Record<string, string> | undefined;
    if (await taken("pieces", "slug", piece.slug))
      errors.push(`A piece with the slug ${piece.slug} exists.`);
    if (await taken("pieces", "code", piece.code))
      errors.push(`A piece with the code ${piece.code} exists.`);
    if (await taken("pieces", "fourthwall_slug", fourthwallSlug))
      errors.push(`A piece already uses the Fourthwall slug ${fourthwallSlug}.`);
    const design = await taken("archive_designs", "product_slug", piece.slug);
    if (design && design.design_key !== designKeyFor(target, piece.slug))
      errors.push(`The Archive already has ${piece.slug} as ${design.design_key}.`);
    const slugDesign = await taken("archive_designs", "fourthwall_slug", fourthwallSlug);
    if (slugDesign && slugDesign.product_slug !== piece.slug)
      errors.push(
        `The Archive design ${slugDesign.design_key} uses the Fourthwall slug ${fourthwallSlug}.`,
      );
    if (piece.fourthwallOfferId) {
      const offer = piece.fourthwallOfferId;
      const owner =
        (await taken("pieces", "fourthwall_offer_id", offer)) ??
        (await taken("archive_designs", "fourthwall_offer_id", offer));
      if (owner && (owner.slug ?? owner.product_slug) !== piece.slug)
        errors.push(`The offer id ${offer} belongs to ${owner.slug ?? owner.product_slug}.`);
    } else
      warnings.push(
        "No Fourthwall offer id: the piece matches its product by slug until one is set.",
      );

    const content = await readContent(db());
    if (guide) content.sizeGuides[guide[0]] = guide[1];
    if (!content.collections.some((c) => c.slug === target))
      content.collections.push({
        slug: target,
        name: target,
        number: "",
        tagline: "",
        story: "",
        scriptureRef: "",
      });
    try {
      checkPiece(content, { ...piece, collection: target, releasedAt: piece.releasedAt ?? "" });
    } catch (err) {
      errors.push(`piece.json: ${(err as Error).message}.`);
    }
    const unknown = piece.colors.filter((c) => !content.colors[c]);
    if (unknown.length)
      warnings.push(
        `No brand swatch for ${unknown.join(", ")}: shoppers see Fourthwall’s swatch, and a neutral one until the piece is live.`,
      );
    if (!piece.plate)
      warnings.push("No plate: the home page and the design story show it on coal.");
    else if (!(piece.plate.token in PLATE_HEX) && !piece.plate.swatch)
      warnings.push(`${piece.plate.token} is a new plate: its color is read from plate-wide.webp.`);
  }

  // Images.
  const sized = async (name: string, w: number, h: number) => {
    const size = await imageSize(files[name]!);
    if (!size) return void errors.push(`${name} isn’t an image.`);
    if (size.width === w && size.height === h) return;
    const ratio = Math.abs(size.width / size.height - w / h) > 0.01;
    warnings.push(
      `${name} is ${size.width}×${size.height}; expected ${w}×${h}${ratio ? ", a wrong aspect ratio" : ""}.`,
    );
  };
  if (piece) {
    if (piece.images.length < 4) errors.push("piece.json lists fewer than four gallery images.");
    for (const img of piece.images) {
      if (!has(img.url)) errors.push(`${img.url} is listed in piece.json but isn’t in the zip.`);
      else await sized(img.url, GALLERY.width, GALLERY.height);
    }
  }
  for (const name of Object.values(MEDIA)) {
    if (!has(name)) errors.push(`${name} is missing.`);
  }
  if (has(MEDIA.plateWide)) await sized(MEDIA.plateWide, 1600, 900);
  if (has(MEDIA.plateTall)) await sized(MEDIA.plateTall, 900, 1400);
  if (has(MEDIA.detail)) {
    const size = await imageSize(files[MEDIA.detail]!);
    if (!size) errors.push(`${MEDIA.detail} isn’t an image.`);
    else if (Math.abs(size.width / size.height - 0.8) > 0.01)
      warnings.push(`${MEDIA.detail} is ${size.width}×${size.height}, a wrong aspect ratio (4:5).`);
  }
  if (has(MEDIA.piece) && !(await imageSize(files[MEDIA.piece]!)))
    errors.push(`${MEDIA.piece} isn’t an image.`);
  for (const [format, spec] of Object.entries(WALLPAPERS)) {
    const name = wallpaper(files, format as AssetFormat);
    if (!name) {
      warnings.push(`No ${format} wallpaper.`);
      continue;
    }
    const file = files[name]!;
    const header = readImageHeader(Buffer.from(file));
    if (!header) errors.push(`${name} isn’t a PNG or JPEG.`);
    else if (file.length > WALLPAPER_MAX_BYTES) errors.push(`${name} is over 50 MB.`);
    else if (header.width !== spec.width || header.height !== spec.height)
      warnings.push(
        `${name} is ${header.width}×${header.height}; expected ${spec.width}×${spec.height}.`,
      );
  }

  // Customer-facing words: no supplier, no internal code.
  if (piece) {
    const blanks = [...(guideRows ?? []).map((g) => g.blank as string), guide?.[1].blank ?? ""];
    const suppliers = supplierNames(blanks.filter(Boolean));
    const words: [string, string][] = [
      ["name", piece.name],
      ...Object.entries(piece.story).map(([k, v]): [string, string] => [`story.${k}`, v ?? ""]),
      ["Scripture", piece.scripture.kjv],
      ...piece.images.map((img, i): [string, string] => [`image ${i + 1} alt text`, img.alt]),
    ];
    if (draft)
      words.push(
        ["public preview", draft.public_preview],
        ["biblical context", draft.biblical_context],
        ["design story", draft.design_story],
        ["imagery meaning", draft.imagery_meaning],
        ["founder note", draft.founder_note],
        ["share copy", draft.share_copy],
      );
    if ("create" in choice)
      words.push(
        ["collection name", choice.create.name],
        ["collection tagline", choice.create.tagline],
        ["collection story", choice.create.story],
      );
    if (guide) {
      const g = guide[1];
      words.push(
        ["size guide name", g.name],
        ["size guide fit", g.fit ?? ""],
        ["size guide note", g.note ?? ""],
      );
      words.push(...g.measures.map((m): [string, string] => [`size guide ${m.label}`, m.how]));
    }
    const code = new RegExp(
      `\\bA3-[A-Z]\\d+\\b|${piece.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i",
    );
    for (const [where, value] of words) {
      const supplier = suppliers.find((s) =>
        new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(value),
      );
      if (supplier) errors.push(`The ${where} names the supplier (${supplier}).`);
      if (code.test(value)) errors.push(`The ${where} shows an internal code.`);
    }
  }

  return {
    report: {
      errors,
      warnings,
      piece: piece
        ? { slug: piece.slug, name: piece.name, code: piece.code, collection: target }
        : null,
    },
    piece,
    draft,
    guide,
    collection,
  };
}

function wallpaper(files: Record<string, Uint8Array>, format: AssetFormat): string | undefined {
  return Object.keys(files).find(
    (n) => n.startsWith("wallpapers/") && n.endsWith(`-${format}.png`),
  );
}

/** Checks an uploaded zip against the collection it would go in. Nothing is created. */
export async function checkImport(importId: string, choice: ImportCollection): Promise<ZipReport> {
  const { bytes, files } = await loadImport(importId);
  const { report } = await checkFiles(files, choice);
  await db().from("piece_imports").update({ report, bytes }).eq("id", importId);
  return report;
}

/** Creates everything the zip holds, as drafts. Returns the new piece's slug. */
export async function commitImport(importId: string, choice: ImportCollection, actor: string) {
  const { row, bytes, files } = await loadImport(importId);
  const checked = await checkFiles(files, choice);
  const { report, piece, draft, guide } = checked;
  if (report.errors.length > 0 || !piece || !draft)
    throw new UserError(`Fix the zip first: ${report.errors[0] ?? "it can’t be read"}`);

  const collection =
    "create" in choice ? await saveCollection(null, choice.create, actor) : checked.collection!;

  if (guide) {
    const [id, value] = guide;
    const png = files["size-guide.png"];
    let image = value.image;
    if (png) {
      const webp = await toWebp(png, 1600);
      image = {
        url: await storeImage("size-guides", id, webp.bytes),
        width: webp.width,
        height: webp.height,
      };
    }
    const { error } = await db().from("size_guides").insert({
      id,
      name: value.name,
      blank: value.blank,
      fit: value.fit,
      note: value.note,
      tolerance: value.tolerance,
      image,
      measures: value.measures,
      rows: value.rows,
    });
    if (error) throw new Error(`size guide insert failed: ${error.message}`);
  }

  const store = async (name: string, file: string) =>
    storeImage(piece.slug, name, (await toWebp(files[file]!)).bytes);
  const images = [];
  for (const [i, img] of piece.images.entries())
    images.push({ ...img, url: await store(String(i + 1), img.url) });
  const media = {
    detail: await store("detail", MEDIA.detail),
    piece: await store("piece", MEDIA.piece),
    plateWide: await store("plate-wide", MEDIA.plateWide),
    plateTall: await store("plate-tall", MEDIA.plateTall),
  };
  const plate =
    piece.plate && !piece.plate.swatch && !(piece.plate.token in PLATE_HEX)
      ? { ...piece.plate, swatch: await sampleSwatch(files[MEDIA.plateWide]!) }
      : (piece.plate ?? null);

  const fourthwallSlug = piece.fourthwallSlug ?? piece.slug;
  const { data: inserted, error } = await db()
    .from("pieces")
    .insert({
      slug: piece.slug,
      code: piece.code,
      name: piece.name,
      collection_id: collection.id,
      position: piece.position,
      category: piece.category,
      colors: piece.colors,
      price_cents: piece.priceCents,
      size_price_cents: piece.sizePriceCents ?? {},
      size_guide_id: piece.sizeGuide ?? null,
      scripture: piece.scripture,
      story: piece.story,
      plate,
      images,
      media,
      featured: piece.featured,
      released_at: collection.released_at ?? new Date().toISOString().slice(0, 10),
      fourthwall_slug: fourthwallSlug,
      status: "draft",
      import_id: row.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(`piece insert failed: ${error.message}`);

  const designKey = designKeyFor(collection.slug, piece.slug);
  await upsertDesigns([
    {
      slug: piece.slug,
      name: piece.name,
      fourthwallSlug,
      position: piece.position,
      collection: { slug: collection.slug },
      scripture: { reference: piece.scripture.reference },
    },
  ]);
  if (piece.fourthwallOfferId) await mapOffer(designKey, piece.fourthwallOfferId, actor);

  const { count } = await db()
    .from("archive_design_content")
    .select("id", { count: "exact", head: true })
    .eq("design_key", designKey);
  if (count)
    report.warnings.push("The design already had Archive copy, so content.json was left out.");
  else
    await insertDraft(
      { ...draft, design_key: designKey },
      actor,
      `Imported from ${row.file_name}. The founder note is proposed wording for Richard's review.`,
    );

  for (const format of ["phone", "desktop"] as const) {
    const name = wallpaper(files, format);
    if (name)
      await ingestAsset({
        designKey,
        format,
        title: WALLPAPERS[format].title,
        bytes: Buffer.from(files[name]!),
        actor,
      });
  }

  // Reference files for the review page: never published anywhere.
  const refs: Record<string, string> = {};
  const references = Object.keys(files).filter(
    (n) =>
      (n.startsWith("fourthwall-images/") && n.endsWith(".png")) ||
      n === "site-preview.pdf" ||
      n === "collection-preview.pdf",
  );
  for (const name of references) {
    const path = `${row.id}/ref/${name}`;
    const { error: refError } = await db()
      .storage.from(IMPORT_BUCKET)
      .upload(path, files[name]!, {
        contentType: name.endsWith(".pdf") ? "application/pdf" : "image/png",
        upsert: true,
      });
    if (!refError) refs[name] = path;
  }
  if (refs["collection-preview.pdf"])
    await db()
      .from("collections")
      .update({ preview_pdf_path: refs["collection-preview.pdf"] })
      .eq("id", collection.id);
  await db().from("piece_imports").update({ report, bytes, ref_paths: refs }).eq("id", row.id);
  await audit(actor, "import.commit", "piece", (inserted as { id: string }).id, null, {
    import: row.id,
    file: row.file_name,
    warnings: report.warnings.length,
  });
  return piece.slug;
}
