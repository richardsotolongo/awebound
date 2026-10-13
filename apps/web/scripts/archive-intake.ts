/**
 * Registers a wallpaper file in the private bucket from the command line, for files handed to
 * Claude or the owner directly. Reads the real pixel size and type from the bytes; PNG masters are
 * expected (a JPEG is accepted and recorded as JPEG). Leave --design out to register it unassigned
 * and pick the design later on the admin Assets page.
 *
 * Usage: pnpm --filter @awebound/web archive:intake -- <file> --format phone|desktop
 *          [--design <product-slug>] [--title "Phone wallpaper"] [--publish]
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { arg, hasFlag, requireEnv } from "./_env";

requireEnv("NEXT_PUBLIC_SUPABASE_URL");
requireEnv("SUPABASE_SECRET_KEY");

const file = process.argv.slice(2).find((a) => !a.startsWith("--") && !["phone", "desktop"].includes(a) && a !== arg("--design") && a !== arg("--title"));
const format = arg("--format");
if (!file || (format !== "phone" && format !== "desktop")) {
  console.error("Usage: archive:intake -- <file> --format phone|desktop [--design <slug>] [--title ...] [--publish]");
  process.exit(1);
}
const slug = arg("--design") ?? null;
const title = arg("--title") ?? (format === "phone" ? "Phone wallpaper" : "Desktop wallpaper");

const { getDesignBySlug } = await import("../src/server/archive/designs");
const { ingestAsset, publishAsset, readImageHeader } = await import("../src/server/archive/assets");

const bytes = await readFile(file);
const header = readImageHeader(bytes);
if (!header) {
  console.error(`${basename(file)} is not a PNG or JPEG image.`);
  process.exit(1);
}
const design = slug ? await getDesignBySlug(slug) : null;
if (slug && !design) {
  console.error(`No design with slug ${slug}. Run archive:seed first, or leave --design out.`);
  process.exit(1);
}
const row = await ingestAsset({ designKey: design?.design_key ?? null, format, title, bytes, actor: null });
console.info(`registered ${row.id}: ${row.mime} ${row.width} x ${row.height}, ${row.bytes} bytes, ${design ? design.name : "unassigned"} (${format}), status ${row.status}`);
if (header.mime !== "image/png") console.info("Note: a PNG master is expected; this file is recorded as JPEG.");
if (hasFlag("--publish")) {
  if (!design) {
    console.error("A file can only be published once it is assigned to a design.");
    process.exit(1);
  }
  await publishAsset(row.id, "00000000-0000-0000-0000-000000000000");
  console.info("published.");
}
