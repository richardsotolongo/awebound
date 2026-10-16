import "server-only";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { shopSlug, type AssetFormat, type OwnedExtra } from "@/shared";
import { serverEnv } from "../env";
import { UserError } from "../errors";
import { audit } from "./audit";
import { getDesign } from "./designs";
import { getEntitlement } from "./entitlements";
import type { AssetRow } from "./types";

/**
 * Wallpapers live in a private Supabase Storage bucket. A file is registered from its real bytes
 * (signature, pixel size, hash), assigned to a design, and published deliberately; an owner's
 * download is a 60-second signed URL issued after the entitlement check.
 */

function admin() {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  return supabaseAdmin;
}

export interface ImageHeader {
  mime: "image/png" | "image/jpeg";
  width: number;
  height: number;
}

/** Reads the dimensions from the file itself: PNG IHDR, or the first JPEG SOF segment. */
export function readImageHeader(buf: Buffer): ImageHeader | null {
  const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (
    buf.length >= 24 &&
    buf.subarray(0, 8).equals(PNG) &&
    buf.toString("ascii", 12, 16) === "IHDR"
  ) {
    return { mime: "image/png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1]!;
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        i += 2;
        continue;
      }
      const length = buf.readUInt16BE(i + 2);
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return {
          mime: "image/jpeg",
          height: buf.readUInt16BE(i + 5),
          width: buf.readUInt16BE(i + 7),
        };
      }
      i += 2 + length;
    }
  }
  return null;
}

export const assetPath = (
  designSlug: string | null,
  format: AssetFormat,
  id: string,
  ext: "png" | "jpg",
) => `${designSlug ?? "unassigned"}/${format}/${id}.${ext}`;

/** A one-time upload target so the browser sends the file straight to Storage (never through Vercel). */
export async function createUploadTarget(
  designKey: string | null,
  format: AssetFormat,
  fileName: string,
  actor: string,
) {
  const design = designKey ? await getDesign(designKey) : null;
  if (designKey && !design) throw new UserError("Unknown design.");
  const ext = /\.png$/i.test(fileName) ? "png" : "jpg";
  const path = assetPath(design?.product_slug ?? null, format, crypto.randomUUID(), ext);
  const bucket = serverEnv.ARCHIVE_STORAGE_BUCKET;
  const { data, error } = await admin().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`upload target failed: ${error?.message}`);
  await audit(actor, "asset.upload_target", "asset", path, null, { designKey, format });
  return { bucket, path, token: data.token };
}

/** Registers a file that is in the bucket: downloads it, reads its real type and size, records it. */
export async function registerAsset(input: {
  designKey: string | null;
  format: AssetFormat;
  path: string;
  title: string;
  actor: string | null;
  bytes?: Buffer;
}): Promise<AssetRow> {
  const bucket = serverEnv.ARCHIVE_STORAGE_BUCKET;
  let bytes = input.bytes;
  if (!bytes) {
    const { data, error } = await admin().storage.from(bucket).download(input.path);
    if (error || !data) throw new UserError("The upload didn’t arrive. Try again.");
    bytes = Buffer.from(await data.arrayBuffer());
  }
  const header = readImageHeader(bytes);
  if (!header) {
    await admin().storage.from(bucket).remove([input.path]);
    throw new UserError("That file isn’t a PNG or JPEG image. Upload the original PNG.");
  }
  const { data, error } = await admin()
    .from("archive_assets")
    .insert({
      design_key: input.designKey,
      format: input.format,
      storage_bucket: bucket,
      storage_path: input.path,
      mime: header.mime,
      width: header.width,
      height: header.height,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      title: input.title,
      status: "uploaded",
      uploaded_by: input.actor,
    })
    .select("*")
    .single();
  if (error) throw new Error(`asset register failed: ${error.message}`);
  await audit(input.actor, "asset.register", "asset", (data as AssetRow).id, null, {
    designKey: input.designKey,
    format: input.format,
    mime: header.mime,
    width: header.width,
    height: header.height,
  });
  return data as AssetRow;
}

/** Uploads bytes from the server (the intake script) and registers them. */
export async function ingestAsset(input: {
  designKey: string | null;
  format: AssetFormat;
  title: string;
  bytes: Buffer;
  actor: string | null;
}): Promise<AssetRow> {
  const header = readImageHeader(input.bytes);
  if (!header) throw new UserError("That file isn’t a PNG or JPEG image.");
  const design = input.designKey ? await getDesign(input.designKey) : null;
  if (input.designKey && !design) throw new UserError("Unknown design.");
  const path = assetPath(
    design?.product_slug ?? null,
    input.format,
    crypto.randomUUID(),
    header.mime === "image/png" ? "png" : "jpg",
  );
  const { error } = await admin()
    .storage.from(serverEnv.ARCHIVE_STORAGE_BUCKET)
    .upload(path, input.bytes, { contentType: header.mime, upsert: false });
  if (error) throw new Error(`asset upload failed: ${error.message}`);
  return registerAsset({ ...input, path, bytes: input.bytes });
}

export async function getAsset(id: string): Promise<AssetRow | null> {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("archive_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as AssetRow | null) ?? null;
}

export async function listAssets(designKey?: string): Promise<AssetRow[]> {
  if (!supabaseAdmin) return [];
  let query = supabaseAdmin
    .from("archive_assets")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (designKey) query = query.eq("design_key", designKey);
  const { data } = await query;
  return (data ?? []) as AssetRow[];
}

export async function assignAsset(id: string, designKey: string, actor: string) {
  const asset = await getAsset(id);
  if (!asset) throw new UserError("Unknown file.");
  if (asset.status === "published") throw new UserError("Retire the file before moving it.");
  if (!(await getDesign(designKey))) throw new UserError("Unknown design.");
  const { error } = await admin()
    .from("archive_assets")
    .update({ design_key: designKey })
    .eq("id", id);
  if (error) throw new Error(`asset assign failed: ${error.message}`);
  await audit(actor, "asset.assign", "asset", id, { designKey: asset.design_key }, { designKey });
}

/**
 * Makes a file the live wallpaper for its design and format; the previous one retires. `actor` is
 * the owner's account, or null from the command line (archive:intake).
 */
export async function publishAsset(id: string, actor: string | null) {
  const asset = await getAsset(id);
  if (!asset) throw new UserError("Unknown file.");
  if (!asset.design_key) throw new UserError("Assign the file to a design first.");
  if (asset.status === "retired")
    throw new UserError("A retired file can’t be published again. Upload it afresh.");
  const now = new Date().toISOString();
  const { error: retire } = await admin()
    .from("archive_assets")
    .update({ status: "retired", retired_at: now })
    .eq("design_key", asset.design_key)
    .eq("format", asset.format)
    .eq("status", "published")
    .neq("id", id);
  if (retire) throw new Error(`asset retire failed: ${retire.message}`);
  const { error } = await admin()
    .from("archive_assets")
    .update({ status: "published", published_by: actor, published_at: now })
    .eq("id", id);
  if (error) throw new Error(`asset publish failed: ${error.message}`);
  await audit(
    actor,
    "asset.publish",
    "asset",
    id,
    { status: asset.status },
    { status: "published" },
  );
}

export async function retireAsset(id: string, actor: string) {
  const asset = await getAsset(id);
  if (!asset) throw new UserError("Unknown file.");
  const { error } = await admin()
    .from("archive_assets")
    .update({ status: "retired", retired_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`asset retire failed: ${error.message}`);
  await audit(actor, "asset.retire", "asset", id, { status: asset.status }, { status: "retired" });
}

/** The two formats as an owner sees them: a published file, or the honest preparing state. */
export async function assetsForOwnedCard(designKey: string): Promise<OwnedExtra[]> {
  const published = (await listAssets(designKey)).filter((a) => a.status === "published");
  return (["phone", "desktop"] as const).map((format) => {
    const file = published.find((a) => a.format === format);
    return file
      ? {
          format,
          status: "published",
          id: file.id,
          title: file.title,
          width: file.width,
          height: file.height,
        }
      : { format, status: "preparing" };
  });
}

/** Ten-minute links to the files themselves, for the owner's Assets page to show what each one is. */
export async function previewUrls(assets: AssetRow[]): Promise<Record<string, string>> {
  if (!supabaseAdmin || assets.length === 0) return {};
  const bucket = serverEnv.ARCHIVE_STORAGE_BUCKET;
  const mine = assets.filter((a) => a.storage_bucket === bucket);
  const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrls(
    mine.map((a) => a.storage_path),
    600,
  );
  const urls: Record<string, string> = {};
  for (const [i, item] of (data ?? []).entries()) {
    const asset = mine[i];
    if (asset && item.signedUrl) urls[asset.id] = item.signedUrl;
  }
  return urls;
}

/** A short-lived download link, only for a published file of a design the account owns. */
export async function signedAssetUrl(assetId: string, userId: string): Promise<string | null> {
  const asset = await getAsset(assetId);
  if (!asset || asset.status !== "published" || !asset.design_key) return null;
  const design = await getDesign(asset.design_key);
  if (!design || !(await getEntitlement(userId, asset.design_key))) return null;
  const ext = asset.mime === "image/png" ? "png" : "jpg";
  const { data, error } = await admin()
    .storage.from(asset.storage_bucket)
    .createSignedUrl(asset.storage_path, 60, {
      download: `behold-${shopSlug(design.product_slug)}-${asset.format}.${ext}`,
    });
  if (error || !data) return null;
  return data.signedUrl;
}
