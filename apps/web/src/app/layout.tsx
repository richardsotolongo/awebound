import { BRAND_HEX } from "@awebound/brand";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { BagDrawer } from "@/features/bag/bag-drawer";
import { siteUrl } from "@/lib/env";
import { SITE } from "@/lib/site";
import "./globals.css";

// Self-hosted (SIL Open Font License) so pages never call a third-party font server.
const cinzel = localFont({
  src: "../../node_modules/@fontsource-variable/cinzel/files/cinzel-latin-wght-normal.woff2",
  variable: "--font-cinzel",
  weight: "400 900",
  display: "swap",
  fallback: ["Trajan Pro", "Georgia", "serif"],
});

const archivo = localFont({
  src: "../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Awebound — Christian apparel, worn without shame",
    template: "%s · Awebound",
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Awebound — Christian apparel, worn without shame",
    description: SITE.description,
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "The Awebound Thorn Cross and wordmark" },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: BRAND_HEX.surfacePage,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${cinzel.variable} ${archivo.variable}`}>
      <body>
        <a className="aw-skip" href="#main">
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <BagDrawer />
        </Providers>
      </body>
    </html>
  );
}
