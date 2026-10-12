import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";

export interface PlateProps extends Omit<HTMLAttributes<HTMLElement>, "color"> {
  /** The piece's plate color as a CSS value, e.g. `var(--plate-oxblood)`. */
  color: string;
  /** What sits on it: bone on the darker surfaces, coal on the lighter ones. */
  ink: "bone" | "coal";
  /** The surface image, portrait: shown below 900px, and above it when there is no `wide`. */
  tall?: string;
  /** The surface image, landscape: shown from 900px. */
  wide?: string;
  /** Load the surface first: the plate that opens a page. */
  priority?: boolean;
  as?: "section" | "div";
  children: ReactNode;
}

/**
 * A piece's own surface as a full-bleed field. Put only large lettering (24px and up), filled
 * buttons and images on it; small text belongs on coal or bone. Buttons inside take the ink.
 */
export function Plate({
  color,
  ink,
  tall,
  wide,
  priority,
  as: Tag = "section",
  className,
  style,
  children,
  ...rest
}: PlateProps) {
  return (
    <Tag
      {...rest}
      className={cx("aw-plate", className)}
      data-ink={ink}
      style={{ "--plate": color, ...style } as CSSProperties}
    >
      {tall ? (
        <picture className="aw-plate-bg" aria-hidden="true">
          {wide ? <source media="(min-width: 900px)" srcSet={wide} /> : null}
          <img
            src={tall}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
          />
        </picture>
      ) : null}
      {children}
    </Tag>
  );
}
