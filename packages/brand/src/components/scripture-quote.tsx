import { cx } from "../cx";
import { ScriptureRef } from "./scripture-ref";

export interface ScriptureQuoteProps {
  /** Exact wording, without surrounding quotation marks. */
  text: string;
  reference: string;
  translation: string;
  /** Part of the verse rather than all of it. */
  excerpt?: boolean;
  /** "sm" in cards, "md" beside a product name, "lg" for a featured verse. */
  size?: "sm" | "md" | "lg";
  align?: "center" | "start";
  className?: string;
}

/**
 * Wraps a quotation in curly double quotes. Quotation marks inside the verse become single
 * quotes, so nesting reads correctly: “They asked, ‘Who is this?’”
 */
export function quoted(text: string): string {
  return `“${text.replace(/“/g, "‘").replace(/”/g, "’")}”`;
}

/**
 * A Scripture quotation: the words in Cormorant Garamond italic, the reference beneath in
 * upright type, with the translation (and "excerpt" when only part of the verse is quoted).
 * Quotes always wrap in full; never truncate them.
 */
export function ScriptureQuote({
  text,
  reference,
  translation,
  excerpt,
  size = "md",
  align = "start",
  className,
}: ScriptureQuoteProps) {
  return (
    <figure className={cx("aw-verse", `aw-verse-${size}`, `aw-verse-${align}`, className)}>
      <blockquote className="aw-quote">
        <p>{quoted(text)}</p>
      </blockquote>
      <figcaption>
        <ScriptureRef
          reference={reference}
          translation={translation}
          excerpt={excerpt}
          align={align}
        />
      </figcaption>
    </figure>
  );
}
