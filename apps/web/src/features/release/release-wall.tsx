import type { CSSProperties } from "react";
import Link from "next/link";
import type { ProductSummary } from "@/shared";
import { ArrowRightIcon } from "@/components/icons";
import { ReleaseCard } from "./release-card";

/**
 * Pieces as one unbroken field of their own colors: no gaps, the words under each tile. When
 * the last row comes up short, a tile fills the rest of it with the link in `more`.
 */
export function ReleaseWall({
  pieces,
  label,
  more,
  nameOnLeave,
}: {
  pieces: ProductSummary[];
  /** Names the list for screen readers: "The Behold pieces". */
  label: string;
  more?: { href: string; label: string };
  /** The wall on a product page (see `ReleaseCard`). */
  nameOnLeave?: boolean;
}) {
  // Cells left empty in the last row at each of the wall's column counts (`.wall` in site.css).
  const short = (columns: number) => (columns - (pieces.length % columns)) % columns;
  const [two, three, five] = [short(2), short(3), short(5)];
  return (
    <ul className="wall" aria-label={label}>
      {pieces.map((p) => (
        <li key={p.slug}>
          <ReleaseCard product={p} tile nameOnLeave={nameOnLeave} />
        </li>
      ))}
      {more && (two || three || five) ? (
        <li
          className="wall-more"
          data-two={two > 0}
          data-three={three > 0}
          data-five={five > 0}
          style={{ "--two": two, "--three": three, "--five": five } as CSSProperties}
        >
          <Link href={more.href}>
            <span>{more.label}</span>
            <ArrowRightIcon size={28} />
          </Link>
        </li>
      ) : null}
    </ul>
  );
}
