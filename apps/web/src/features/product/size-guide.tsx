import type { SizeGuide as Guide } from "@/shared";
import Link from "next/link";

/**
 * The size guide sheet's body: the owner's size guide image for the piece's blank, with the same
 * measurements as a table for screen readers. A guide without an image shows the table itself.
 * A sizing note, when a guide has one, leads because an image would put it at the bottom.
 */
export function SizeGuide({ guide, cut }: { guide: Guide | null; cut: string }) {
  if (!guide) {
    return (
      <div className="prose">
        <p>
          Measurements for this {cut.toLowerCase()} are posted before ordering opens.{" "}
          <Link href="/contact">Ask us</Link> if you need them sooner.
        </p>
      </div>
    );
  }

  const table = (
    <table className="size-table">
      <caption className="visually-hidden">{guide.name} measurements in inches</caption>
      <thead>
        <tr>
          <th scope="col">Size</th>
          {guide.measures.map((m) => (
            <th scope="col" key={m.label}>
              {m.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {guide.rows.map((row) => (
          <tr key={row.size}>
            <th scope="row" style={{ color: "var(--ink)" }}>
              {row.size}
            </th>
            {row.values.map((value, i) => (
              <td key={guide.measures[i]?.label ?? i}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  const howTo = (
    <ul className="size-guide-how">
      {guide.measures.map((m) => (
        <li key={m.label}>
          <span style={{ color: "var(--ink)" }}>{m.label}:</span> {m.how}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="size-guide">
      {guide.fit ? <p className="aw-body">{guide.fit}</p> : null}
      {guide.note ? <p className="size-guide-note">{guide.note}</p> : null}

      {guide.image ? (
        <>
          <a
            href={guide.image.url}
            target="_blank"
            rel="noopener"
            className="size-guide-image"
            aria-describedby="size-guide-open"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a static guide shown at its own size */}
            <img
              src={guide.image.url}
              width={guide.image.width}
              height={guide.image.height}
              alt={`Awebound size guide for the ${guide.name}: how to measure, and each size's measurements in inches`}
            />
          </a>
          <p id="size-guide-open" className="field-help">
            Select the guide to open it full size.
          </p>
          <div className="visually-hidden">
            <p>How to measure:</p>
            {howTo}
            {table}
            {guide.tolerance ? <p>{guide.tolerance}</p> : null}
          </div>
        </>
      ) : (
        <>
          <p className="aw-small">Measurements in inches.</p>
          {table}
          {howTo}
          {guide.tolerance ? <p className="field-help">{guide.tolerance}</p> : null}
        </>
      )}
    </div>
  );
}
