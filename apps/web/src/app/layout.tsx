import { BRAND_HEX } from "@awebound/brand";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { AskAi } from "@/components/ask-ai";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SocialLinks } from "@/components/social-links";
import { SiteHeader } from "@/components/site-header";
import { BagDrawer } from "@/features/bag/bag-drawer";
import { siteUrl } from "@/lib/env";
import { SHARE_IMAGE, SITE } from "@/lib/site";
import { TRANSLATION_NOTICE } from "@/server/scripture";
import "./globals.css";

// Self-hosted (SIL Open Font License) so pages never call a third-party font server. Only the
// files actually used are loaded: Grenze Gotisch for display headings, Manrope for body and
// interface, and the one Cormorant Garamond italic weight used for Scripture.
const grenze = localFont({
  src: "../../node_modules/@fontsource-variable/grenze-gotisch/files/grenze-gotisch-latin-wght-normal.woff2",
  variable: "--font-grenze",
  weight: "100 900",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

const cormorant = localFont({
  src: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2",
  variable: "--font-cormorant",
  weight: "500",
  style: "italic",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  applicationName: SITE.name,
  description: SITE.description,
  // The share card for pages that set none (bag, sign-in, not found). Indexable pages set their
  // own, with a canonical address, through pageMeta.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [SHARE_IMAGE],
  },
  // Twitter's title, description and image follow each page's Open Graph values.
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: BRAND_HEX.surfacePage,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${grenze.variable} ${manrope.variable} ${cormorant.variable}`}
    >
      <body>
        <a className="aw-skip" href="#main">
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter notice={TRANSLATION_NOTICE}>
            <SocialLinks />
            <AskAi />
          </SiteFooter>
          <BagDrawer />
        </Providers>
      </body>
    </html>
  );
}
