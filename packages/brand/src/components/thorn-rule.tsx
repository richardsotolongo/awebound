import { useId } from "react";
import { cx } from "../cx";
import { ThornCross } from "./marks";

export interface ThornRuleProps {
  /** Show the small Thorn Cross at the center. Default true. */
  cross?: boolean;
  className?: string;
}

/** The section divider: a hairline with small alternating thorns. Use between sections, not list items. */
export function ThornRule({ cross = true, className }: ThornRuleProps) {
  const id = `aw-tp-${useId().replace(/:/g, "")}`;
  return (
    <div role="separator" className={cx("aw-rule", className)}>
      <svg className="aw-rule-line" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <pattern id={id} width={32} height={16} patternUnits="userSpaceOnUse">
            <rect x={0} y={7.5} width={32} height={1} className="aw-rule-ink" />
            <path d="M10.4 8 L16.5 1.5 L13.6 8 Z" className="aw-rule-ink" />
            <path d="M26.4 8 L32.5 14.5 L29.6 8 Z" className="aw-rule-ink" />
          </pattern>
        </defs>
        <rect width="100%" height={16} fill={`url(#${id})`} />
      </svg>
      {cross ? (
        <span className="aw-rule-cross">
          <ThornCross size="small" height={26} title="" />
        </span>
      ) : null}
    </div>
  );
}
