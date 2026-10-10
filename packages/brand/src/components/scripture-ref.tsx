import { cx } from "../cx";

export interface ScriptureRefProps {
  /** Full book name, chapter and verse: "Galatians 5:1", ranges with an en dash: "Luke 24:1–6". */
  reference: string;
  /** The translation, only when its words are quoted beside the reference. */
  translation?: string;
  /** The quote is part of the verse: "Matthew 9:21 — NIV, excerpt". */
  excerpt?: boolean;
  align?: "center" | "start";
  className?: string;
}

/** A Scripture reference in upright type: "Mark 4:41 — NIV". */
export function ScriptureRef({
  reference,
  translation,
  excerpt,
  align = "center",
  className,
}: ScriptureRefProps) {
  return (
    <span className={cx("aw-scripture", align === "start" && "aw-scripture-start", className)}>
      <span>
        {reference}
        {translation ? (
          <span className="aw-scripture-tr">{` — ${translation}${excerpt ? ", excerpt" : ""}`}</span>
        ) : null}
      </span>
    </span>
  );
}
