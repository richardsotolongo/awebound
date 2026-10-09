import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { LEGAL } from "@/lib/site";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

const POLICIES = [
  { href: "/refunds", label: "Refunds" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/**
 * Shared layout for the policy pages. The copy is a starting draft written for Awebound's setup;
 * have it reviewed before launch (docs/TODOS.md). A draft notice shows outside production.
 */
export function LegalPage({
  title,
  intro,
  current,
  sections,
}: {
  title: string;
  intro: ReactNode;
  current: string;
  sections: LegalSection[];
}) {
  return (
    <div className="aw-container">
      <PageHeader eyebrow={`Last updated ${LEGAL.lastUpdated}`} title={title} intro={intro}>
        <nav aria-label="Policies" className="aw-btn-row" style={{ gap: "var(--space-6)" }}>
          {POLICIES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="aw-btn aw-btn-link"
              aria-current={p.href === current ? "page" : undefined}
              style={p.href === current ? { color: "var(--ink)" } : undefined}
            >
              {p.label}
            </Link>
          ))}
        </nav>
        {process.env.NODE_ENV !== "production" ? (
          <p className="notice aw-small" role="note">
            Draft for review. Have this policy checked before launch; it is not legal advice.
          </p>
        ) : null}
      </PageHeader>
      <div className="legal-layout">
        <nav className="legal-toc" aria-label="On this page">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title}
            </a>
          ))}
        </nav>
        <div className="prose">
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`}>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
