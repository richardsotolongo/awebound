import "server-only";
import { z } from "zod";
import type { ScriptureQuote, Translation } from "@/shared";
import { serverEnv } from "./env";
import verses from "./content/verses.json";

/**
 * One Scripture record: the exact wording in each translation the website can quote. Products
 * and site sections keep one record each, so every place a verse appears shows the same words.
 */
export const ScriptureRecordSchema = z.object({
  /** Full book name, chapter and verse: "Exodus 3:5". */
  reference: z.string(),
  /** True when the website quotes only part of the verse. */
  excerpt: z.boolean(),
  niv: z.string(),
  kjv: z.string(),
});
export type ScriptureRecord = z.infer<typeof ScriptureRecordSchema>;

/**
 * The translation the website quotes. NIV by default; set SCRIPTURE_TRANSLATION=KJV to switch
 * every quotation and translation statement back (for example, while NIV permission is pending).
 */
export const TRANSLATION: Translation = serverEnv.SCRIPTURE_TRANSLATION;

export function quote(record: ScriptureRecord): ScriptureQuote {
  return {
    text: TRANSLATION === "NIV" ? record.niv : record.kjv,
    reference: record.reference,
    translation: TRANSLATION,
    excerpt: record.excerpt,
  };
}

const SiteVerses = z.object({ notAshamed: ScriptureRecordSchema, planted: ScriptureRecordSchema });
const site = SiteVerses.parse(verses);

/** Verses quoted outside the product pages. */
export const VERSES = {
  /** Romans 1:16: "worn without shame". */
  notAshamed: quote(site.notAshamed),
  /** 1 Corinthians 3:6: the seed that is planted. */
  planted: quote(site.planted),
};

export const TRANSLATION_NAME =
  TRANSLATION === "NIV" ? "New International Version (NIV)" : "King James Version (KJV)";

/**
 * The copyright notice for the website's quotations. Biblica asks for this notice wherever NIV
 * text is quoted; confirm the exact wording with Biblica when permission is granted.
 */
export const TRANSLATION_NOTICE =
  TRANSLATION === "NIV"
    ? "Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide."
    : "Scripture quotations are from the King James Version, which is in the public domain in the United States.";
