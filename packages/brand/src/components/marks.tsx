import type { CSSProperties } from "react";
import { cx } from "../cx";
import {
  LILY,
  THORN_CROSS,
  THORN_CROSS_SMALL,
  THORN_VINE,
  THORN_WREATH,
  WORDMARK,
  type MarkGeometry,
} from "../marks/paths";

interface BaseMarkProps {
  /** Height in px; width follows the mark's proportions. */
  height?: number;
  /** CSS color for the ink. Defaults to the parent's color. */
  color?: string;
  /** Accessible name. Pass "" when the mark is decorative. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

function MarkSvg({
  geometry,
  height,
  color,
  title,
  defaultTitle,
  className,
  style,
}: BaseMarkProps & { geometry: MarkGeometry; defaultTitle: string; height: number }) {
  const decorative = title === "";
  return (
    <svg
      viewBox={geometry.viewBox}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : (title ?? defaultTitle)}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
      className={cx("aw-logo", className)}
      style={{ height, width: "auto", color, ...style }}
    >
      <path d={geometry.d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/**
 * The A3 Thornbound wordmark. Artwork, never type. Keep it at least 120px wide
 * (about 56px tall); below that use <ThornCross size="small" />.
 */
export function Wordmark({ height = 48, ...rest }: BaseMarkProps) {
  return <MarkSvg geometry={WORDMARK} height={height} defaultTitle="Awebound" {...rest} />;
}

export interface ThornCrossProps extends BaseMarkProps {
  /** "full" at 96px and up, "small" below. */
  size?: "full" | "small";
}

/** The Thorn Cross: Awebound's only cross. Upright and whole, single ink. */
export function ThornCross({ size = "full", height, ...rest }: ThornCrossProps) {
  return (
    <MarkSvg
      geometry={size === "small" ? THORN_CROSS_SMALL : THORN_CROSS}
      height={height ?? (size === "small" ? 32 : 120)}
      defaultTitle="Thorn Cross"
      {...rest}
    />
  );
}

export type SecondaryMarkName = "lily" | "thorn-vine" | "thorn-wreath";

const SECONDARY: Record<SecondaryMarkName, { geometry: MarkGeometry; title: string }> = {
  lily: { geometry: LILY, title: "Lily" },
  "thorn-vine": { geometry: THORN_VINE, title: "Thorn vine" },
  "thorn-wreath": { geometry: THORN_WREATH, title: "Thorn wreath" },
};

/** Secondary marks: lily, thorn vine, thorn wreath. One ink each; never stack more than two marks. */
export function Mark({ name, height = 64, ...rest }: BaseMarkProps & { name: SecondaryMarkName }) {
  const mark = SECONDARY[name];
  return <MarkSvg geometry={mark.geometry} height={height} defaultTitle={mark.title} {...rest} />;
}
