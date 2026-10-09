"use client";

import { cx } from "../cx";
import { BrandLink } from "../link";
import { Wordmark } from "./marks";

export interface NavLink {
  label: string;
  href: string;
}

export interface HeaderProps {
  links?: NavLink[];
  /** Label of the active link. */
  current?: string;
  bagCount?: number;
  /** Opens the bag drawer. When omitted the bag renders as a link to bagHref. */
  onBag?: () => void;
  bagHref?: string;
  homeHref?: string;
  /** Toggles the phone menu. */
  onMenu?: () => void;
  menuOpen?: boolean;
  /** id of the phone menu panel, for aria-controls. */
  menuId?: string;
  className?: string;
}

const DEFAULT_LINKS: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Site header: wordmark, links and the bag count, collapsing to a menu button on phones. */
export function Header({
  links = DEFAULT_LINKS,
  current,
  bagCount = 0,
  onBag,
  bagHref = "/bag",
  homeHref = "/",
  onMenu,
  menuOpen = false,
  menuId,
  className,
}: HeaderProps) {
  const bagLabel = (
    <>
      Bag <span className="aw-header-count">{bagCount}</span>
    </>
  );
  return (
    <header className={cx("aw-header", className)}>
      <div className="aw-header-in">
        <button
          type="button"
          className="aw-header-menu"
          onClick={onMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls={menuId}
        >
          <span />
          <span />
          <span />
        </button>
        <BrandLink href={homeHref} className="aw-header-logo" aria-label="Awebound home">
          <Wordmark height={56} title="" />
        </BrandLink>
        <nav className="aw-header-nav" aria-label="Main">
          {links.map((l) => (
            <BrandLink key={l.label} href={l.href} aria-current={current === l.label ? "page" : undefined}>
              {l.label}
            </BrandLink>
          ))}
        </nav>
        {onBag ? (
          <button type="button" className="aw-header-bag" onClick={onBag} aria-label={`Bag, ${bagCount} items`}>
            {bagLabel}
          </button>
        ) : (
          <BrandLink href={bagHref} className="aw-header-bag" aria-label={`Bag, ${bagCount} items`}>
            {bagLabel}
          </BrandLink>
        )}
      </div>
    </header>
  );
}
