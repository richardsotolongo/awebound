"use client";

import Link from "next/link";
import { usePath } from "@/lib/pathname";

const LINKS = [
  { label: "Health", href: "/account/admin" },
  { label: "Content", href: "/account/admin/content" },
  { label: "Assets", href: "/account/admin/assets" },
  { label: "Mappings", href: "/account/admin/mappings" },
  { label: "Orders", href: "/account/admin/orders" },
  { label: "Founding", href: "/account/admin/founding" },
  { label: "Audit", href: "/account/admin/audit" },
];

/** The owner's sections. Plain links; the current one is darker. */
export function AdminNav() {
  const pathname = usePath();
  const current = (href: string) =>
    href === "/account/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav aria-label="Owner" className="admin-nav">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={current(l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
