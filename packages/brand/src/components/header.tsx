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
  /** Sign-in or account link, shown beside the bag. Omit when accounts are off. */
  account?: NavLink;
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

const icon = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  "aria-hidden": true,
} as const;

const PersonIcon = () => (
  <svg {...icon}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const BagIcon = () => (
  <svg {...icon}>
    <path d="M5 8h14l-1 13H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

/**
 * Site header: wordmark, links, the account link and the bag, collapsing to a menu button on
 * phones. The bag is outlined, not filled, because each screen's one primary button is elsewhere.
 */
export function Header({
  links = DEFAULT_LINKS,
  current,
  account,
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
      <BagIcon />
      <span className="aw-header-bag-label">Bag</span>
      <span className="aw-header-count">{bagCount}</span>
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
            <BrandLink
              key={l.label}
              href={l.href}
              aria-current={current === l.label ? "page" : undefined}
            >
              {l.label}
            </BrandLink>
          ))}
        </nav>
        <div className="aw-header-actions">
          {account ? (
            <BrandLink
              href={account.href}
              className="aw-header-account"
              aria-current={current === account.label ? "page" : undefined}
            >
              <PersonIcon />
              <span className="aw-header-account-label">{account.label}</span>
            </BrandLink>
          ) : null}
          {onBag ? (
            <button
              type="button"
              className="aw-header-bag"
              onClick={onBag}
              aria-label={`Bag, ${bagCount} items`}
            >
              {bagLabel}
            </button>
          ) : (
            <BrandLink
              href={bagHref}
              className="aw-header-bag"
              aria-label={`Bag, ${bagCount} items`}
            >
              {bagLabel}
            </BrandLink>
          )}
        </div>
      </div>
    </header>
  );
}
