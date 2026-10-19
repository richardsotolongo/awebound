import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  /** A plain line under the title, such as when a policy was last updated. */
  note?: string;
  intro?: ReactNode;
  /** Keeps the H1 for screen readers only, where a tab above already names the page. */
  hideTitle?: boolean;
  children?: ReactNode;
}

/** Title block for inner pages: the H1, then one short paragraph. Nothing sits above the title. */
export function PageHeader({ title, note, intro, hideTitle, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      <h1 className={hideTitle ? "visually-hidden" : "aw-h1"}>{title}</h1>
      {note ? <p className="aw-small">{note}</p> : null}
      {intro ? <div className="aw-body">{intro}</div> : null}
      {children}
    </header>
  );
}
