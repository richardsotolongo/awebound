import "server-only";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { UserError } from "../errors";

/** Public: new pieces' and size guides' images, served straight to shoppers. */
export const PRODUCT_BUCKET = "product-images";
/** Private: the piece zips and the reference files copied out of them. */
export const IMPORT_BUCKET = "piece-imports";

export function db() {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  return supabaseAdmin;
}

export interface Webp {
  bytes: Buffer;
  width: number;
  height: number;
}

/** Any image sharp can read, as WebP; a WebP within `maxWidth` passes through untouched. */
export async function toWebp(input: Buffer | Uint8Array, maxWidth?: number): Promise<Webp> {
  const buf = Buffer.from(input);
  const meta = await sharp(buf)
    .metadata()
    .catch(() => null);
  if (!meta?.width || !meta.height) throw new UserError("That file isn’t an image.");
  if (meta.format === "webp" && (!maxWidth || meta.width <= maxWidth))
    return { bytes: buf, width: meta.width, height: meta.height };
  const { data, info } = await sharp(buf)
    .resize(maxWidth && meta.width > maxWidth ? { width: maxWidth } : undefined)
    .webp({ quality: 90 })
    .toBuffer({ resolveWithObject: true });
  return { bytes: data, width: info.width, height: info.height };
}

/** An image's pixel size, or null when it isn't one. */
export async function imageSize(input: Uint8Array) {
  const meta = await sharp(Buffer.from(input))
    .metadata()
    .catch(() => null);
  return meta?.width && meta.height ? { width: meta.width, height: meta.height } : null;
}

/** Stores a WebP named after its content, so a replaced image is a new address no cache can hold. */
export async function storeImage(folder: string, name: string, webp: Buffer): Promise<string> {
  const hash = createHash("sha256").update(webp).digest("hex").slice(0, 10);
  const path = `${folder}/${name}-${hash}.webp`;
  const bucket = db().storage.from(PRODUCT_BUCKET);
  const { error } = await bucket.upload(path, webp, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`image upload failed: ${error.message}`);
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Removes our stored images (never the site's own files) that nothing in `keep` still uses. */
export async function removeImages(urls: (string | null | undefined)[], keep: string[] = []) {
  const bucket = db().storage.from(PRODUCT_BUCKET);
  const prefix = bucket.getPublicUrl("").data.publicUrl;
  const paths = urls
    .filter((u): u is string => Boolean(u?.startsWith(prefix)) && !keep.includes(u!))
    .map((u) => u.slice(prefix.length));
  if (paths.length > 0) await bucket.remove([...new Set(paths)]);
}

/** A one-time upload address for an image the owner is replacing (moved and renamed on register). */
export async function createImageUpload(fileName: string) {
  const ext = fileName.split(".").pop()!.toLowerCase();
  const path = `uploads/${randomUUID()}.${ext}`;
  const { data, error } = await db().storage.from(PRODUCT_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`upload target failed: ${error?.message}`);
  return { bucket: PRODUCT_BUCKET, path, token: data.token };
}

/** The bytes the browser uploaded, taken out of the upload folder. */
export async function takeUpload(path: string): Promise<Buffer> {
  const bucket = db().storage.from(PRODUCT_BUCKET);
  const { data, error } = await bucket.download(path);
  await bucket.remove([path]);
  if (error || !data) throw new UserError("The upload didn’t arrive. Try again.");
  return Buffer.from(await data.arrayBuffer());
}

/** The color of a plate's surface, read from its plate image. */
export async function sampleSwatch(input: Uint8Array): Promise<string> {
  const { dominant } = await sharp(Buffer.from(input)).stats();
  return `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** A private reference file for the owner's eyes only: a 10-minute address. */
export async function signedImportUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await db().storage.from(IMPORT_BUCKET).createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
