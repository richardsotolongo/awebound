"use client";

import Link from "next/link";
import { usePath } from "@/lib/pathname";

const LINKS = [
  { label: "Collection", href: "/account" },
  { label: "Saved", href: "/account/saved" },
  { label: "Orders", href: "/account/orders" },
  { label: "Ideas", href: "/account/ideas" },
  { label: "Account", href: "/account/settings" },
];

/**
 * My Archive's title, then its sections as equal tabs (the owner's choice, October 2026). Collection
 * is the landing page and stays marked on a design's own page. The current tab is underlined.
 * Founding Members also get a Founding tab.
 */
export function ArchiveNav({ admin, founding }: { admin: boolean; founding: boolean }) {
  const pathname = usePath();
  // Founding sits before Account for the members who hold the seal; Owner comes last.
  const base = founding
    ? [...LINKS.slice(0, 4), { label: "Founding", href: "/account/founding" }, ...LINKS.slice(4)]
    : LINKS;
  const links = admin ? [...base, { label: "Owner", href: "/account/admin" }] : base;
  const current = (href: string) =>
    href === "/account"
      ? pathname === href || pathname.startsWith("/account/collection")
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav aria-label="My Archive" className="archive-nav">
      <p className="aw-h1 archive-nav-title">My Archive</p>
      <div className="archive-nav-links">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={current(l.href) ? "page" : undefined}
            data-tone={
              l.href === "/account/ideas"
                ? "ideas"
                : l.href === "/account"
                  ? "collection"
                  : undefined
            }
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
