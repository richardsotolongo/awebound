import type { MarkGeometry } from "@awebound/brand";
import type { SVGProps } from "react";

interface MarkPathProps extends Omit<SVGProps<SVGGElement>, "width"> {
  geometry: MarkGeometry;
  /** Center of the mark in the parent SVG's coordinates. */
  cx: number;
  cy: number;
  /** Height in the parent SVG's coordinates; width follows the mark. */
  height: number;
}

/** Places a brand mark (Thorn Cross, lily…) inside a scene SVG, upright and whole. */
export function MarkPath({ geometry, cx, cy, height, ...rest }: MarkPathProps) {
  const [minX = 0, minY = 0, w = 1, h = 1] = geometry.viewBox.split(/\s+/).map(Number);
  const s = height / h;
  const x = cx - (w * s) / 2 - minX * s;
  const y = cy - height / 2 - minY * s;
  return (
    <g {...rest}>
      <path
        d={geometry.d}
        transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(5)})`}
        fillRule="evenodd"
      />
    </g>
  );
}
