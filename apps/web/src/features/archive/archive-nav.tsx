"use client";

import Link from "next/link";
import { usePath } from "@/lib/pathname";

type Tab = { label: string; href: string; tone?: string };

const SPECIAL: Tab[] = [
  { label: "Collection", href: "/account", tone: "collection" },
  { label: "Ideas", href: "/account/ideas", tone: "ideas" },
];
const FOUNDING: Tab = { label: "Founding", href: "/account/founding", tone: "founding" };
const LINKS: Tab[] = [
  { label: "Saved", href: "/account/saved" },
  { label: "Orders", href: "/account/orders" },
  { label: "Account", href: "/account/settings" },
];

/**
 * My Archive's title, then its tabs (the owner's order, October 2026): the special ones filled in
 * colour (Collection, Ideas, and Founding for the members who hold the seal), a rule, then Saved,
 * Orders, Account and, for admins, Owner. Collection is the landing page and stays marked on a
 * design's own page. The current tab is underlined.
 */
export function ArchiveNav({ admin, founding }: { admin: boolean; founding: boolean }) {
  const pathname = usePath();
  const special = founding ? [...SPECIAL, FOUNDING] : SPECIAL;
  const rest = admin ? [...LINKS, { label: "Owner", href: "/account/admin" }] : LINKS;
  const current = (href: string) =>
    href === "/account"
      ? pathname === href || pathname.startsWith("/account/collection")
      : pathname === href || pathname.startsWith(`${href}/`);
  const tab = (l: Tab) => (
    <Link
      key={l.href}
      href={l.href}
      aria-current={current(l.href) ? "page" : undefined}
      data-tone={l.tone}
    >
      {l.label}
    </Link>
  );
  return (
    <nav aria-label="My Archive" className="archive-nav">
      <p className="aw-h1 archive-nav-title">My Archive</p>
      <div className="archive-nav-links">
        {special.map(tab)}
        <span className="archive-nav-break" aria-hidden="true" />
        {rest.map(tab)}
      </div>
    </nav>
  );
}
