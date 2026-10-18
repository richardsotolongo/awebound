import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteUrl } from "@/lib/env";

/**
 * A site image's bytes: a `/…` address from public/ (or from the site itself when the file isn't
 * beside the server), anything else, such as the product-images bucket, over HTTPS.
 */
export async function readImage(url: string): Promise<Buffer> {
  if (url.startsWith("/")) {
    try {
      return await readFile(join(process.cwd(), "public", url));
    } catch {
      url = new URL(url, siteUrl).href;
    }
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`image fetch failed with ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
