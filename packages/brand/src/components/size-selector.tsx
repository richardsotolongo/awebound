"use client";

import { cx } from "../cx";
import { useRadioGroup } from "./radio-group";

export interface SizeSelectorProps {
  sizes?: string[];
  value?: string;
  /** Sold-out sizes, struck through. */
  unavailable?: string[];
  onChange?: (size: string) => void;
  label?: string;
  className?: string;
}

/** Size picker for apparel, with sold-out sizes struck through. */
export function SizeSelector({
  sizes = ["S", "M", "L", "XL", "2XL"],
  value,
  unavailable = [],
  onChange,
  label = "Size",
  className,
}: SizeSelectorProps) {
  const { itemProps } = useRadioGroup(sizes, value, onChange, unavailable);
  return (
    <div role="radiogroup" aria-label={label} className={cx("aw-sizes", className)}>
      {sizes.map((s, i) => {
        const na = unavailable.includes(s);
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={na}
            aria-label={na ? `${s}, sold out` : s}
            className={cx("aw-size", on && "is-on", na && "is-na")}
            onClick={() => onChange?.(s)}
            {...itemProps(s, i)}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
