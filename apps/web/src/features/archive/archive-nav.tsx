"use client";

import Link from "next/link";
import { usePath } from "@/lib/pathname";

const LINKS = [
  { label: "Saved", href: "/account/saved" },
  { label: "Collection", href: "/account/collection" },
  { label: "Orders", href: "/account/orders" },
  { label: "Settings", href: "/account/settings" },
];

/**
 * The account's sections: My Archive (the overview) as the red button, a rule, then plain links;
 * the current one is underlined.
 */
export function ArchiveNav({ admin }: { admin: boolean }) {
  const pathname = usePath();
  const links = admin ? [...LINKS, { label: "Owner", href: "/account/admin" }] : LINKS;
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav aria-label="Account" className="archive-nav">
      <Link
        href="/account"
        className="aw-btn aw-btn-primary archive-nav-home"
        aria-current={pathname === "/account" ? "page" : undefined}
      >
        My Archive
      </Link>
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
