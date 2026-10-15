import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { BRAND_HEX } from "@awebound/brand/hex";
import { WORDMARK } from "@awebound/brand/marks";
import { quoted } from "@awebound/brand/scripture-quote";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import sharp from "sharp";
import type { ProductDetail } from "@/shared";
import { TRANSLATION_NOTICE } from "../scripture";
import { loadFonts } from "./fonts";
import type { ContentRow, DesignRow } from "./types";

/**
 * The owned design card: one PDF per published design, built from the approved content and the
 * piece's own artwork. It carries nothing about the buyer or the order, so one file serves every
 * owner. US Letter, the paper card colors from the brand, embedded brand fonts.
 */

const PAGE = { width: 612, height: 792, margin: 48 };
const hex = (h: string) => {
  const n = parseInt(h.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const COLOR = {
  paper: hex(BRAND_HEX.paper),
  coal: hex(BRAND_HEX.coal),
  muted: hex(BRAND_HEX.muted),
  oxblood: hex(BRAND_HEX.oxblood),
};

/** Drops characters the embedded font can't draw instead of failing the whole card. */
function printable(font: PDFFont, text: string): string {
  const set = new Set(font.getCharacterSet());
  return [...text.replace(/\r\n?/g, "\n")]
    .map((ch) => (ch === "\n" || set.has(ch.codePointAt(0)!) ? ch : "?"))
    .join("");
}

function wrap(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of printable(font, text).split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(test, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

export async function renderDesignCardPdf(
  design: DesignRow,
  content: ContentRow,
  product: ProductDetail,
): Promise<Uint8Array> {
  const fonts = loadFonts();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${design.name} design card`);
  doc.setAuthor("Awebound");
  doc.setProducer("Awebound");
  const grenze = await doc.embedFont(fonts.grenze600, { subset: true });
  const sans = await doc.embedFont(fonts.manrope400, { subset: true });
  const sansBold = await doc.embedFont(fonts.manrope700, { subset: true });
  const italic = await doc.embedFont(fonts.cormorant500i, { subset: true });

  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;
  const width = right - left;
  let page: PDFPage;
  let y = 0;

  const newPage = () => {
    page = doc.addPage([PAGE.width, PAGE.height]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE.width, height: PAGE.height, color: COLOR.paper });
    const footerY = 28;
    page.drawText("Bound in awe. Worn without shame.", {
      x: left,
      y: footerY,
      size: 8,
      font: sansBold,
      color: COLOR.muted,
    });
    const site = "www.awebound.store";
    page.drawText(site, {
      x: right - sansBold.widthOfTextAtSize(site, 8),
      y: footerY,
      size: 8,
      font: sansBold,
      color: COLOR.muted,
    });
    y = PAGE.height - PAGE.margin;
  };
  const ensure = (needed: number) => {
    if (y - needed < PAGE.margin + 24) newPage();
  };
  const paragraph = (
    text: string,
    font: PDFFont,
    size: number,
    lineHeight: number,
    color = COLOR.coal,
    maxWidth = width,
    x = left,
  ) => {
    for (const line of wrap(font, size, text, maxWidth)) {
      ensure(lineHeight);
      page.drawText(line, { x, y: y - size, size, font, color });
      y -= lineHeight;
    }
  };
  const heading = (text: string) => {
    ensure(40);
    y -= 14;
    page.drawText(printable(sansBold, text.toUpperCase()), {
      x: left,
      y: y - 9,
      size: 9,
      font: sansBold,
      color: COLOR.muted,
    });
    y -= 20;
  };

  newPage();

  // Wordmark: the path's box starts at (29, 34) in its own units; scale it to 150 pt wide.
  const [vx, vy, vw, vh] = WORDMARK.viewBox.split(" ").map(Number) as [
    number,
    number,
    number,
    number,
  ];
  const scale = 150 / vw;
  page!.drawSvgPath(WORDMARK.d, {
    x: left - vx * scale,
    y: y + vy * scale,
    scale,
    color: COLOR.oxblood,
  });
  y -= vh * scale + 28;

  // Header: name and cut beside the artwork.
  const artWidth = 200;
  const artHeight = Math.round(artWidth * 1.25);
  const textWidth = width - artWidth - 24;
  const artTop = y;
  try {
    const webp = await readFile(
      join(process.cwd(), "public", "products", design.product_slug, "detail.webp"),
    );
    const png = await doc.embedPng(await sharp(webp).png().toBuffer());
    page!.drawImage(png, {
      x: right - artWidth,
      y: artTop - artHeight,
      width: artWidth,
      height: artHeight,
    });
  } catch {
    // The card still reads without its picture.
  }
  paragraph(design.name, grenze, 28, 32, COLOR.coal, textWidth);
  y -= 4;
  paragraph(
    `From ${product.collection.name}, Release ${product.collection.number}. ${product.category.cut}.`,
    sans,
    10.5,
    15,
    COLOR.muted,
    textWidth,
  );
  y -= 12;
  paragraph(quoted(product.scripture.text), italic, 14, 19, COLOR.coal, textWidth);
  y -= 2;
  paragraph(
    `${product.scripture.reference} — ${product.scripture.translation}${product.scripture.excerpt ? ", excerpt" : ""}`,
    sansBold,
    8.5,
    13,
    COLOR.muted,
    textWidth,
  );
  y = Math.min(y, artTop - artHeight) - 8;

  heading("The passage in context");
  paragraph(content.biblical_context, sans, 10.5, 15);
  if (content.context_reference) {
    y -= 4;
    paragraph(`Read ${content.context_reference}.`, sans, 9.5, 14, COLOR.muted);
  }
  heading("The design");
  paragraph(content.design_story, sans, 10.5, 15);
  heading("The imagery");
  paragraph(content.imagery_meaning, sans, 10.5, 15);
  heading("A note from Richard");
  paragraph(content.founder_note, sans, 10.5, 15);
  y -= 2;
  paragraph("Richard, founder of Awebound", sansBold, 9, 13, COLOR.muted);
  heading("The piece");
  paragraph(`${product.category.cut}. ${product.story.art}`, sans, 10.5, 15);
  y -= 16;
  paragraph(TRANSLATION_NOTICE, sans, 7.5, 11, COLOR.muted);

  return doc.save();
}
