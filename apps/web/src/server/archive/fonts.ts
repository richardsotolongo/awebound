import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The site's three families as static WOFF files (the variable WOFF2 files the pages use can't be
 * read by the PDF and image renderers). Read once; a missing file turns the exports off through
 * readiness instead of failing a page.
 */
export interface ExportFonts {
  grenze600: Buffer;
  manrope400: Buffer;
  manrope700: Buffer;
  cormorant500i: Buffer;
}

export class FontsUnavailableError extends Error {}

const FILES = {
  grenze600: "@fontsource/grenze-gotisch/files/grenze-gotisch-latin-600-normal.woff",
  manrope400: "@fontsource/manrope/files/manrope-latin-400-normal.woff",
  manrope700: "@fontsource/manrope/files/manrope-latin-700-normal.woff",
  cormorant500i: "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff",
} as const;

let fonts: ExportFonts | null = null;

export function loadFonts(): ExportFonts {
  if (fonts) return fonts;
  try {
    const read = (file: string) => readFileSync(join(process.cwd(), "node_modules", file));
    fonts = {
      grenze600: read(FILES.grenze600),
      manrope400: read(FILES.manrope400),
      manrope700: read(FILES.manrope700),
      cormorant500i: read(FILES.cormorant500i),
    };
    return fonts;
  } catch (err) {
    throw new FontsUnavailableError(`export fonts missing: ${String(err)}`);
  }
}
