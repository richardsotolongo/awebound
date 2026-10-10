"use client";

import { Header, ThornCross, type NavLink } from "@awebound/brand";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { bagCount, useBag } from "@/features/bag/bag-store";
import { accountsEnabled } from "@/lib/env";
import { MAIN_NAV } from "@/lib/site";
import { useSignedIn } from "@/lib/supabase/browser";
import { Sheet } from "./sheet";

const isAccountPage = (pathname: string) =>
  pathname.startsWith("/account") || pathname.startsWith("/sign-in");

function currentLabel(pathname: string, account: NavLink | undefined): string | undefined {
  if (account && isAccountPage(pathname)) return account.label;
  if (pathname.startsWith("/shop")) return "Shop";
  return MAIN_NAV.find((l) => l.href !== "/" && pathname.startsWith(l.href))?.label;
}

/** "Sign in" (back to this page afterwards) or "Account"; nothing while accounts are off. */
function accountLink(signedIn: boolean, pathname: string): NavLink | undefined {
  if (!accountsEnabled) return undefined;
  if (signedIn) return { label: "Account", href: "/account" };
  const next = isAccountPage(pathname) ? "" : `?next=${encodeURIComponent(pathname)}`;
  return { label: "Sign in", href: `/sign-in${next}` };
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useBag((s) => bagCount(s.lines));
  const openBag = useBag((s) => s.open);
  const signedIn = useSignedIn();
  const account = accountLink(signedIn, pathname);
  const current = currentLabel(pathname, account);

  // Close the phone menu after navigating (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  return (
    <div className="site-header">
      <Header
        links={MAIN_NAV}
        current={current}
        account={account}
        bagCount={count}
        onBag={openBag}
        onMenu={() => setMenuOpen((o) => !o)}
        menuOpen={menuOpen}
        menuId="site-menu"
      />
      <Sheet
        id="site-menu"
        side="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
      >
        {account ? (
          <div className="mobile-account">
            <Link href={account.href} className="aw-btn aw-btn-secondary aw-btn-block">
              {account.label}
            </Link>
            {signedIn ? null : (
              <p className="aw-small">Optional. You never need an account to order.</p>
            )}
          </div>
        ) : null}
        <nav aria-label="Main" className="mobile-nav">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
            Home
          </Link>
          {MAIN_NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={current === l.label ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="More" className="mobile-nav-secondary">
          <Link href="/faq">FAQ</Link>
          <Link href="/refunds">Refunds</Link>
        </nav>
        <div style={{ marginTop: "var(--space-12)", color: "var(--line-strong)" }}>
          <ThornCross size="small" height={40} title="" />
        </div>
      </Sheet>
    </div>
  );
}
