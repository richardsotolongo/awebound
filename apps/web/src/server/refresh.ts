import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";
import { ARCHIVE_PUBLIC_TAG } from "./archive/offer";
import { CATALOG_CONTENT_TAG } from "./content";
import { syncIndexNow } from "./indexnow";

/**
 * After content goes live, changes or comes down, the public pages show it now rather than within
 * the minute their caches last: the catalog and Archive reads and every page's cached render. Once
 * the answer is sent, IndexNow hears about the pages that changed. Server Actions only.
 */
export function refreshPublicPages() {
  updateTag(CATALOG_CONTENT_TAG);
  updateTag(ARCHIVE_PUBLIC_TAG);
  revalidatePath("/", "layout");
  after(() => syncIndexNow().catch((err) => console.error("[indexnow]", err)));
}
