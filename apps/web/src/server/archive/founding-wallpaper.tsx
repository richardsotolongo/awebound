import "server-only";
import { BRAND_HEX } from "@awebound/brand/hex";
import { THORN_CROSS, WORDMARK } from "@awebound/brand/marks";
import { ImageResponse } from "next/og";
import { loadFonts } from "./fonts";

/**
 * The Founding Member wallpaper (approved by the owner, October 2026): the Thorn Cross,
 * "Founding Member" in the display lettering, the member's own place ("No. 12 of 50") and the
 * wordmark, in two colorways. One design; each member's number is drawn when they download it.
 */
export type FoundingTheme = "bone" | "coal";
export type FoundingDevice = "phone" | "desktop";

const SIZES: Record<FoundingDevice, { width: number; height: number }> = {
  phone: { width: 1290, height: 2796 },
  desktop: { width: 2560, height: 1440 },
};

// The renderer can't read CSS variables, so the colors come from the brand's raw values.
const THEMES: Record<FoundingTheme, { bg: string; mark: string; sub: string; rule: string }> = {
  bone: {
    bg: BRAND_HEX.warmBone,
    mark: BRAND_HEX.oxblood,
    sub: BRAND_HEX.muted,
    rule: `${BRAND_HEX.oxblood}59`,
  },
  coal: {
    bg: BRAND_HEX.coal,
    mark: BRAND_HEX.warmBone,
    sub: BRAND_HEX.gold,
    rule: `${BRAND_HEX.warmBone}38`,
  },
};

const ratio = (viewBox: string) => {
  const [, , w = 1, h = 1] = viewBox.split(" ").map(Number);
  return w / h;
};

export async function renderFoundingWallpaper(
  rank: number,
  theme: FoundingTheme,
  device: FoundingDevice,
): Promise<Uint8Array> {
  const fonts = loadFonts();
  const size = SIZES[device];
  const c = THEMES[theme];
  const phone = device === "phone";
  const u = Math.min(size.width, size.height) / 1290;
  const crossH = Math.round((phone ? 560 : 380) * u);
  const wmW = Math.round((phone ? 300 : 190) * u);

  const tree = (
    <div
      style={{
        width: size.width,
        height: size.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: phone ? 0 : Math.round(90 * u),
        background: c.bg,
        position: "relative",
      }}
    >
      <svg
        viewBox={THORN_CROSS.viewBox}
        width={Math.round(crossH * ratio(THORN_CROSS.viewBox))}
        height={crossH}
      >
        <path d={THORN_CROSS.d} fill={c.mark} fillRule="evenodd" />
      </svg>
      <div
        style={{
          fontFamily: "Grenze Gotisch",
          fontSize: Math.round((phone ? 140 : 120) * u),
          lineHeight: 1,
          color: c.mark,
          marginTop: Math.round(70 * u),
        }}
      >
        Founding Member
      </div>
      <div
        style={{
          width: Math.round(160 * u),
          height: Math.max(2, Math.round(3 * u)),
          background: c.rule,
          marginTop: Math.round(56 * u),
          marginBottom: Math.round(44 * u),
        }}
      />
      <div
        style={{
          fontFamily: "Manrope",
          fontWeight: 700,
          fontSize: Math.round(40 * u),
          letterSpacing: Math.round(40 * u * 0.24),
          color: c.sub,
        }}
      >
        {`NO. ${rank} OF 50`}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: Math.round((phone ? 260 : 80) * u),
          display: "flex",
        }}
      >
        <svg
          viewBox={WORDMARK.viewBox}
          width={wmW}
          height={Math.round(wmW / ratio(WORDMARK.viewBox))}
        >
          <path d={WORDMARK.d} fill={c.mark} fillRule="evenodd" />
        </svg>
      </div>
    </div>
  );

  const response = new ImageResponse(tree, {
    ...size,
    fonts: [
      { name: "Grenze Gotisch", data: fonts.grenze600, weight: 600, style: "normal" },
      { name: "Manrope", data: fonts.manrope700, weight: 700, style: "normal" },
    ],
  });
  return new Uint8Array(await response.arrayBuffer());
}
