"use client";

import Link from "next/link";
import { usePath } from "@/lib/pathname";

const LINKS = [
  { label: "Archive", href: "/account" },
  { label: "Saved", href: "/account/saved" },
  { label: "Fit", href: "/account/fit" },
  { label: "Collection", href: "/account/collection" },
  { label: "Orders", href: "/account/orders" },
  { label: "Settings", href: "/account/settings" },
];

/** The sections of My Archive. Plain links; the current one is underlined. */
export function ArchiveNav({ admin }: { admin: boolean }) {
  const pathname = usePath();
  const links = admin ? [...LINKS, { label: "Owner", href: "/account/admin" }] : LINKS;
  const current = (href: string) =>
    href === "/account" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav aria-label="My Archive" className="archive-nav">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={current(l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
