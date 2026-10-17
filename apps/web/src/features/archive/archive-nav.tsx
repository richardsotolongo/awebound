"use client";

import Link from "next/link";
import { usePath } from "@/lib/pathname";

const LINKS = [
  { label: "Saved", href: "/account/saved" },
  { label: "Orders", href: "/account/orders" },
  { label: "Settings", href: "/account/settings" },
];

/**
 * The account's sections. My Archive (the overview) and Your collection, where each bought
 * design's story, Richard's note and extras live, are the red buttons; a rule, then plain links.
 * The current one is marked. Who is signed in sits at the row's far end on wide screens.
 */
export function ArchiveNav({ admin, email }: { admin: boolean; email: string | null }) {
  const pathname = usePath();
  const links = admin ? [...LINKS, { label: "Owner", href: "/account/admin" }] : LINKS;
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav aria-label="Account" className="archive-nav">
      <div className="archive-nav-main">
        <Link
          href="/account"
          className="aw-btn aw-btn-primary"
          aria-current={pathname === "/account" ? "page" : undefined}
        >
          My Archive
        </Link>
        <Link
          href="/account/collection"
          className="aw-btn aw-btn-primary"
          aria-current={current("/account/collection") ? "page" : undefined}
        >
          Your collection
        </Link>
      </div>
      <div className="archive-nav-links">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={current(l.href) ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </div>
      {email ? (
        <p className="aw-small archive-nav-who">
          Signed in as <span className="account-email">{email}</span>
        </p>
      ) : null}
    </nav>
  );
}
