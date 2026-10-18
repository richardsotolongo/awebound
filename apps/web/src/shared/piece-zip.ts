import { unzipSync } from "fflate";

/** Reference files the site never uses, left out before upload. */
const UNUSED = /^([^/]+\/)?(print|previews)\/|(^|\/)(__MACOSX|\.DS_Store)(\/|$)/;

/**
 * A piece zip's files by path, read inside its one top-level folder when it was zipped from one
 * (`thorns-to-lilies-package/piece.json` reads as `piece.json`). Folders, macOS extras and the
 * print and preview files are skipped.
 */
export function unpackZip(bytes: Uint8Array): Record<string, Uint8Array> {
  const files = unzipSync(bytes, {
    filter: (f) => !f.name.endsWith("/") && !UNUSED.test(f.name),
  });
  const names = Object.keys(files);
  const top = names[0]?.split("/")[0];
  const prefix =
    top && names.length > 0 && names.every((n) => n.startsWith(`${top}/`)) ? `${top}/` : "";
  return Object.fromEntries(names.map((n) => [n.slice(prefix.length), files[n]!]));
}

/** The text of a JSON file in the zip, parsed; null when it is missing or not JSON. */
export function zipJson(files: Record<string, Uint8Array>, name: string): unknown {
  const file = files[name];
  if (!file) return null;
  try {
    return JSON.parse(new TextDecoder().decode(file));
  } catch {
    return null;
  }
}
