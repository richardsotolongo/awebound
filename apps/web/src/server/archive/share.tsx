import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { INK_HEX, PLATE_HEX } from "@awebound/brand/hex";
import { WORDMARK } from "@awebound/brand/marks";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { ProductDetail, ShareFormat } from "@/shared";
import { loadFonts } from "./fonts";
import type { ContentRow, DesignRow } from "./types";

/**
 * Share the Story: a portrait (1080x1920) or square (1080x1080) PNG on the piece's own plate,
 * from the approved share copy, the name, the Scripture reference, the cut-out artwork and the
 * wordmark. Never the founder note, the full story or anything about the buyer.
 */
const SIZES: Record<ShareFormat, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

async function artworkDataUrl(slug: string): Promise<string | null> {
  try {
    const webp = await readFile(join(process.cwd(), "public", "products", slug, "piece.webp"));
    const png = await sharp(webp).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderShareImage(
  design: DesignRow,
  content: ContentRow,
  product: ProductDetail,
  format: ShareFormat,
): Promise<Uint8Array> {
  const fonts = loadFonts();
  const size = SIZES[format];
  const token = (product.plate?.token ?? "plate-slate") as keyof typeof PLATE_HEX;
  const background = PLATE_HEX[token] ?? PLATE_HEX["plate-slate"];
  const ink = INK_HEX[product.plate?.ink ?? "bone"];
  const art = await artworkDataUrl(design.product_slug);
  const reference =
    `${product.scripture.reference} · ${product.scripture.translation}`.toUpperCase();
  const wordmark = (
    <svg
      viewBox={WORDMARK.viewBox}
      width={format === "portrait" ? 360 : 300}
      height={format === "portrait" ? 167 : 139}
    >
      <path d={WORDMARK.d} fill={ink} />
    </svg>
  );
  const words = (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, color: ink }}>
      <div
        style={{
          fontFamily: "Grenze Gotisch",
          fontSize: format === "portrait" ? 96 : 76,
          lineHeight: 1,
        }}
      >
        {design.name}
      </div>
      <div
        style={{
          fontFamily: "Manrope",
          fontSize: format === "portrait" ? 40 : 34,
          lineHeight: 1.3,
        }}
      >
        {content.share_copy}
      </div>
      <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 32, letterSpacing: 4 }}>
        {reference}
      </div>
    </div>
  );
  const footer = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "100%",
        fontFamily: "Manrope",
        fontSize: 30,
        lineHeight: 1.2,
        color: ink,
      }}
    >
      <span>Bound in awe. Worn without shame.</span>
      <span style={{ fontWeight: 700 }}>awebound.store/shop/{design.product_slug}</span>
    </div>
  );
  const picture = art ? (
    // eslint-disable-next-line @next/next/no-img-element -- rendered by satori, not a page
    <img
      src={art}
      alt=""
      width={format === "portrait" ? 860 : 520}
      height={format === "portrait" ? 1075 : 650}
      style={{ objectFit: "contain" }}
    />
  ) : null;

  const tree =
    format === "portrait" ? (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 72,
          background,
        }}
      >
        {wordmark}
        {picture}
        {words}
        {footer}
      </div>
    ) : (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          {picture}
          <div style={{ display: "flex", flexDirection: "column", gap: 40, flex: 1 }}>
            {wordmark}
            {words}
          </div>
        </div>
        {footer}
      </div>
    );

  const response = new ImageResponse(tree, {
    ...size,
    fonts: [
      { name: "Grenze Gotisch", data: fonts.grenze600, weight: 600, style: "normal" },
      { name: "Manrope", data: fonts.manrope400, weight: 400, style: "normal" },
      { name: "Manrope", data: fonts.manrope700, weight: 700, style: "normal" },
    ],
  });
  return new Uint8Array(await response.arrayBuffer());
}
