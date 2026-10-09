import type { NavLink } from "@awebound/brand";
import { CONTACT_EMAIL, type CollectionSlug } from "@/shared";

export const SITE = {
  name: "Awebound",
  tagline: "Royal heritage. Freedom. Resurrection.",
  description:
    "Christian apparel for believers who wear their faith without shame. Engraved art and Scripture on tees, oversized tees, tanks and caps.",
  contactEmail: CONTACT_EMAIL,
} as const;

export const MAIN_NAV: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
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

export interface Pillar {
  slug: CollectionSlug;
  family: string;
  pillar: string;
  story: string;
  scripture: string;
}

/** The three pillars and their families. Brand copy, so it renders even if the API is down. */
export const PILLARS: Pillar[] = [
  {
    slug: "royal-heritage",
    family: "Royal Heritage",
    pillar: "Royal heritage",
    story:
      "The throne of grace and a kingdom that cannot be shaken, carved in arches and ornament.",
    scripture: "Hebrews 4:16",
  },
  {
    slug: "broken-bond",
    family: "Broken Bond",
    pillar: "Freedom",
    story: "Chains broken and death without dominion. Stand firm in what was won.",
    scripture: "Galatians 5:1",
  },
  {
    slug: "rolled-away",
    family: "Rolled Away",
    pillar: "Resurrection",
    story: "The stone rolled away and the tomb empty at dawn. New life, worn plainly.",
    scripture: "Luke 24:1–6",
  },
];

/** Legal details still to be confirmed by the owner (docs/TODOS.md). */
export const LEGAL = {
  businessName: "Awebound",
  /** e.g. "the State of Florida". Null until the owner confirms where the business is organized. */
  governingLaw: null as string | null,
  lastUpdated: "October 8, 2026",
};
