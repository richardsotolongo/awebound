import "server-only";
import { z } from "zod";
import {
  ScriptureRecordSchema,
  type ScriptureQuote,
  type ScriptureRecord,
  type Translation,
} from "@/shared";
import verses from "./content/verses.json";

/**
 * The translation the website quotes: the King James Version, the owner's decision on October 16,
 * 2026 (it is in the public domain in the United States, so no permission or notice is needed).
 * Every quotation, translation statement and Bible link follows this one line. Quoting the NIV
 * again needs Biblica's written permission first; the records keep its text for that day.
 */
export const TRANSLATION = "KJV" as Translation;

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

/** bible.com's version ids: 1 is the King James Version, 111 the NIV. */
const BIBLE_COM: Record<Translation, string> = { KJV: "1", NIV: "111" };

/**
 * A bible.com passage link in the website's translation, whatever translation it was saved in
 * (the Archive's links were first written for the NIV). Other links pass through unchanged.
 */
export function bibleLink(url: string): string {
  const m = url.match(
    /^https:\/\/www\.bible\.com\/bible\/\d+\/([1-3]?[A-Z]{2,3}(?:\.\d+){1,2})\.[A-Z0-9]+$/i,
  );
  return m ? `https://www.bible.com/bible/${BIBLE_COM[TRANSLATION]}/${m[1]}.${TRANSLATION}` : url;
}

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
