import type { NavLink } from "@awebound/brand";
import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/shared";

export const SITE = {
  name: "Awebound",
  title: "Awebound — Christian apparel, worn without shame",
  tagline: "Bound in awe. Worn without shame.",
  description:
    "Christian apparel rooted in Scripture and reverence for Jesus Christ. Release 01, Behold, is five oversized tees, three hoodies and two caps, each telling part of His story.",
  contactEmail: CONTACT_EMAIL,
} as const;

/** Awebound's own profiles: the footer's icons and the home page's store data (`sameAs`). */
export const SOCIAL = [
  {
    name: "Instagram",
    handle: "@awebound.store",
    href: "https://www.instagram.com/awebound.store/",
  },
  { name: "TikTok", handle: "@aweboundstore", href: "https://www.tiktok.com/@aweboundstore" },
  {
    name: "Facebook",
    handle: "Awebound",
    href: "https://www.facebook.com/profile.php?id=61595167444851",
  },
] as const;

export const SHARE_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "The Awebound Thorn Cross and wordmark",
};

/**
 * Metadata for an indexable page: its canonical address and a complete share card. A page's
 * openGraph replaces the layout's whole object, so every field is set here. Without a title the
 * page keeps the site's default one.
 */
export function pageMeta({
  path,
  title,
  description = SITE.description,
  image = SHARE_IMAGE,
}: {
  path: string;
  title?: string;
  description?: string;
  image?: { url: string; alt: string; width?: number; height?: number };
}): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: title ? `${title} · ${SITE.name}` : SITE.title,
      description,
      url: path,
      images: [image],
    },
  };
}

export const MAIN_NAV: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_NAV: NavLink[] = [
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Returns", href: "/refunds" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "My Archive", href: "/account" },
  { label: "Contact", href: "/contact" },
];

/** Legal details still to be confirmed by the owner (docs/TODOS.md). */
export const LEGAL = {
  businessName: "Awebound",
  /** e.g. "the State of Florida". Null until the owner confirms where the business is organized. */
  governingLaw: null as string | null,
  lastUpdated: "October 16, 2026",
};
