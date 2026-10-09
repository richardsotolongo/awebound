"use client";

import { Header, ThornCross } from "@awebound/brand";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { bagCount, useBag } from "@/features/bag/bag-store";
import { MAIN_NAV } from "@/lib/site";
import { Sheet } from "./sheet";

function currentLabel(pathname: string): string | undefined {
  if (pathname.startsWith("/shop")) return "Shop";
  return MAIN_NAV.find((l) => l.href !== "/" && pathname.startsWith(l.href))?.label;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useBag((s) => bagCount(s.lines));
  const openBag = useBag((s) => s.open);
  const current = currentLabel(pathname);

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
          <Link href="/account">Account</Link>
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
