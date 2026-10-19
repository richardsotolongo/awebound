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
 */
export function ArchiveNav({ admin }: { admin: boolean }) {
  const pathname = usePath();
  const links = admin ? [...LINKS, { label: "Owner", href: "/account/admin" }] : LINKS;
  const current = (href: string) =>
    href === "/account"
      ? pathname === href || pathname.startsWith("/account/collection")
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav aria-label="My Archive" className="archive-nav">
      <p className="aw-h1 archive-nav-title">My Archive</p>
      <div className="archive-nav-links">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={current(l.href) ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
