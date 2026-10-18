"use client";

import { useId } from "react";

/** A labelled text box: one line, or a few with `lines`. */
export function Field({
  label,
  value,
  onChange,
  lines,
  help,
  type = "text",
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  lines?: number;
  help?: string;
  type?: "text" | "date" | "number";
  max?: number;
}) {
  const id = useId();
  const over = max !== undefined && value.length > max;
  return (
    <div className="field">
      <label htmlFor={id} className="aw-label">
        {label}
      </label>
      {lines ? (
        <textarea
          id={id}
          className="aw-textarea"
          rows={lines}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={over || undefined}
        />
      ) : (
        <input
          id={id}
          className="aw-input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={over || undefined}
        />
      )}
      {max !== undefined ? (
        <p className={over ? "aw-form-error" : "field-help"}>
          {value.length}/{max}
        </p>
      ) : null}
      {help ? <p className="field-help">{help}</p> : null}
    </div>
  );
}

export function Check({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="admin-check">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/** Dollars as typed ("40" or "40.00") to cents; NaN when it isn't a price. */
export const toCents = (dollars: string) => {
  const n = Number(dollars.trim());
  return dollars.trim() === "" || !Number.isFinite(n) ? NaN : Math.round(n * 100);
};
export const toDollars = (cents: number) => (cents / 100).toFixed(2);

/** A slug from a name: "Lamb’s Mark" → "lambs-mark". */
export const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
