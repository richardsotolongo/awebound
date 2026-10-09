import type { NavLink } from "@awebound/brand";
import { CONTACT_EMAIL } from "@/shared";

export const SITE = {
  name: "Awebound",
  tagline: "Bound in awe. Worn without shame.",
  description:
    "Christian apparel made to start conversations about Jesus Christ. The first release, Behold: five tees and a cap carrying engraved art and Scripture.",
  contactEmail: CONTACT_EMAIL,
} as const;

export const MAIN_NAV: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Behold", href: "/#behold" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_NAV: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "FAQ", href: "/faq" },
  { label: "Refunds", href: "/refunds" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Account", href: "/account" },
  { label: "Contact", href: "/contact" },
];

/** Legal details still to be confirmed by the owner (docs/TODOS.md). */
export const LEGAL = {
  businessName: "Awebound",
  /** e.g. "the State of Florida". Null until the owner confirms where the business is organized. */
  governingLaw: null as string | null,
  lastUpdated: "October 8, 2026",
};
