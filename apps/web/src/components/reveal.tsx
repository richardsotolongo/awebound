import type { CSSProperties, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Seconds; nudges where in the scroll the rise finishes. Keep staggers short. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}

/**
 * The brand's standard entrance: a short rise tied to scrolling, in CSS. Content starts mostly
 * visible and is fully legible without JavaScript, in browsers without scroll-driven animation,
 * and with reduced motion (see .reveal in site.css).
 */
export function Reveal({ children, delay = 0, className, as: Component = "div" }: RevealProps) {
  return (
    <Component
      className={className ? `reveal ${className}` : "reveal"}
      style={
        delay ? ({ "--reveal-delay": `${Math.round(delay * 100)}%` } as CSSProperties) : undefined
      }
    >
      {children}
    </Component>
  );
}
