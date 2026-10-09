import type { CategorySlug } from "@/shared";

/**
 * Approximate garment measurements (inches, laid flat) by cut. Replace with the chosen blank
 * supplier's chart once confirmed (docs/TODOS.md).
 */
const CHARTS: Record<
  Exclude<CategorySlug, "hats">,
  { size: string; chest: number; length: number }[]
> = {
  tees: [
    { size: "S", chest: 18, length: 28 },
    { size: "M", chest: 20, length: 29 },
    { size: "L", chest: 22, length: 30 },
    { size: "XL", chest: 24, length: 31 },
    { size: "2XL", chest: 26, length: 32 },
  ],
  "oversized-tees": [
    { size: "S", chest: 21, length: 27.5 },
    { size: "M", chest: 23, length: 28.5 },
    { size: "L", chest: 25, length: 29.5 },
    { size: "XL", chest: 27, length: 30.5 },
    { size: "2XL", chest: 29, length: 31.5 },
  ],
  hoodies: [
    { size: "S", chest: 22, length: 27 },
    { size: "M", chest: 24, length: 28 },
    { size: "L", chest: 26, length: 29 },
    { size: "XL", chest: 28, length: 30 },
    { size: "2XL", chest: 30, length: 31 },
  ],
  tanks: [
    { size: "S", chest: 17, length: 27 },
    { size: "M", chest: 19, length: 28 },
    { size: "L", chest: 21, length: 29 },
    { size: "XL", chest: 23, length: 30 },
    { size: "2XL", chest: 25, length: 31 },
  ],
};

export function SizeGuide({ category, cut }: { category: CategorySlug; cut: string }) {
  if (category === "hats") {
    return (
      <div className="prose">
        <p>
          One size fits most. The snap closure adjusts to fit heads from about 21 to 23.5 inches
          around.
        </p>
      </div>
    );
  }
  const chart = CHARTS[category];
  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      <p className="aw-small">
        {cut} measurements in inches, laid flat. Chest is armpit to armpit; length is from the high
        shoulder to the hem.
      </p>
      <table className="size-table">
        <caption className="visually-hidden">{cut} size chart</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">Chest</th>
            <th scope="col">Length</th>
          </tr>
        </thead>
        <tbody>
          {chart.map((row) => (
            <tr key={row.size}>
              <th scope="row" style={{ color: "var(--ink)" }}>
                {row.size}
              </th>
              <td>{row.chest}</td>
              <td>{row.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="field-help">
        Measurements are approximate until our blanks are final. For the best fit, measure a shirt
        you love and compare.
        {category === "oversized-tees"
          ? " Oversized tees run wide on purpose; size down for a closer fit."
          : category === "hoodies"
            ? " The hoodie has a relaxed fit with room to layer; size down for a closer fit."
            : ""}
      </p>
    </div>
  );
}
