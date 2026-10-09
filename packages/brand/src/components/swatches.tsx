"use client";

import { cx } from "../cx";
import { useRadioGroup } from "./radio-group";

export interface SwatchColor {
  name: string;
  /** CSS color, ideally var(--garment-*) or var(--cap-*). */
  hex: string;
}

export interface SwatchesProps {
  colors: SwatchColor[];
  value?: string;
  onChange?: (name: string) => void;
  label?: string;
  className?: string;
}

/** Garment color picker: square chips with the chosen color named beside them. */
export function Swatches({ colors, value, onChange, label = "Color", className }: SwatchesProps) {
  const { itemProps } = useRadioGroup(
    colors.map((c) => c.name),
    value,
    onChange,
  );
  return (
    <div role="radiogroup" aria-label={label} className={cx("aw-swatches", className)}>
      {colors.map((c, i) => {
        const on = value === c.name;
        return (
          <button
            key={c.name}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c.name}
            title={c.name}
            className={cx("aw-swatch", on && "is-on")}
            onClick={() => onChange?.(c.name)}
            {...itemProps(c.name, i)}
          >
            <i style={{ background: c.hex }} />
          </button>
        );
      })}
      {value ? <span className="aw-small aw-swatches-name">{value}</span> : null}
    </div>
  );
}
