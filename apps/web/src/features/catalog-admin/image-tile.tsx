import type { ReactNode } from "react";

/** One image on the review page in a frame of its kind's shape, with its caption and controls. */
export function ImageTile({
  src,
  label,
  shape = "portrait",
  children,
}: {
  src: string;
  label: string;
  /** portrait: 4:5 (gallery, close-up, garment); wide: 16:9; tall: 9:14; free: its own shape. */
  shape?: "portrait" | "wide" | "tall" | "free";
  children?: ReactNode;
}) {
  return (
    <figure className="review-tile" data-shape={shape}>
      {src ? (
        <a href={src} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element -- owner preview */}
          <img src={src} alt="" loading="lazy" />
        </a>
      ) : null}
      <figcaption>{label}</figcaption>
      {children}
    </figure>
  );
}
