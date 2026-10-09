import { ScriptureRef } from "@awebound/brand";
import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  scripture?: string;
  children?: ReactNode;
}

/** Title block for inner pages: eyebrow, Cinzel H1, one short paragraph. */
export function PageHeader({ eyebrow, title, intro, scripture, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      {eyebrow ? <p className="aw-label">{eyebrow}</p> : null}
      <h1 className="aw-h1">{title}</h1>
      {intro ? <div className="aw-body">{intro}</div> : null}
      {scripture ? <ScriptureRef reference={scripture} align="start" /> : null}
      {children}
    </header>
  );
}
