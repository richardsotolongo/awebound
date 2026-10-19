"use client";

import { Header, ThornCross, type NavLink } from "@awebound/brand";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bagCount, useBag } from "@/features/bag/bag-store";
import { accountsEnabled, envLabel } from "@/lib/env";
import { usePath } from "@/lib/pathname";
import { MAIN_NAV } from "@/lib/site";
import { useSignedIn } from "@/lib/supabase/browser";
import { getFoundingMarkAction } from "@/server/archive-actions";
import { Sheet } from "./sheet";

const isAccountPage = (pathname: string) =>
  pathname.startsWith("/account") || pathname.startsWith("/sign-in");

function currentLabel(pathname: string, account: NavLink | undefined): string | undefined {
  if (account && isAccountPage(pathname)) return account.label;
  if (pathname.startsWith("/shop")) return "Shop";
  return MAIN_NAV.find((l) => l.href !== "/" && pathname.startsWith(l.href))?.label;
}

/**
 * "Sign in" (back to this page afterwards) or "My Archive"; nothing while accounts are off. The
 * phone menu offers the same link as "Join Awebound" to someone signed out.
 */
function accountLink(signedIn: boolean, pathname: string): NavLink | undefined {
  if (!accountsEnabled) return undefined;
  if (signedIn) return { label: "My Archive", href: "/account" };
  const next = isAccountPage(pathname) ? "" : `?next=${encodeURIComponent(pathname)}`;
  return { label: "Sign in", href: `/sign-in${next}` };
}

/**
 * Whether to mark My Archive with the Thorn Cross. Pages are cached for everyone, so the header
 * asks once after sign-in; it stays mounted across navigation, so that's once per visit.
 */
function useFoundingMark(signedIn: boolean): boolean {
  const [founding, setFounding] = useState(false);
  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    getFoundingMarkAction()
      .then((r) => {
        if (live && r.ok) setFounding(r.data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [signedIn]);
  return signedIn && founding;
}

export function SiteHeader() {
  const pathname = usePath();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useBag((s) => bagCount(s.lines));
  const openBag = useBag((s) => s.open);
  const signedIn = useSignedIn();
  const account = accountLink(signedIn, pathname);
  const founding = useFoundingMark(signedIn);
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
        accountIcon={
          founding ? (
            <span className="aw-header-founding" title="Founding Member">
              <ThornCross size="small" height={20} title="" />
            </span>
          ) : undefined
        }
        bagCount={count}
        onBag={openBag}
        onMenu={() => setMenuOpen((o) => !o)}
        menuOpen={menuOpen}
        menuId="site-menu"
        badge={envLabel ?? undefined}
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
              {signedIn ? account.label : "Join Awebound"}
            </Link>
            {signedIn ? null : (
              <p className="aw-small">Free, and never needed to order. Members sign in here too.</p>
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
          <Link href="/refunds">Returns</Link>
        </nav>
        <div style={{ marginTop: "var(--space-12)", color: "var(--line-strong)" }}>
          <ThornCross size="small" height={40} title="" />
        </div>
      </Sheet>
    </div>
  );
}
