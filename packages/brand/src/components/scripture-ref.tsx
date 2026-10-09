import { cx } from "../cx";

export interface ScriptureRefProps {
  /** Full book name, chapter and verse: "Galatians 5:1", ranges with an en dash: "Luke 24:1–6". */
  reference: string;
  /** Only when the full verse is quoted nearby. */
  translation?: "KJV" | "NLT";
  align?: "center" | "start";
  className?: string;
}

/** A Scripture reference set like a tour-poster credit. Reference only, never the verse text. */
export function ScriptureRef({
  reference,
  translation,
  align = "center",
  className,
}: ScriptureRefProps) {
  return (
    <span className={cx("aw-scripture", align === "start" && "aw-scripture-start", className)}>
      {reference}
      {translation ? <span className="aw-scripture-tr"> ({translation})</span> : null}
    </span>
  );
}
