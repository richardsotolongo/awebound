import type { MetadataRoute } from "next";
import { searchProducts, withFallback } from "@/server/catalog";
import { siteUrl } from "@/lib/env";
import { PILLARS } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    "",
    "/shop",
    "/collections",
    "/about",
    "/contact",
    "/faq",
    "/refunds",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.5,
  }));
  const collections = PILLARS.map((p) => ({
    url: `${siteUrl}/collections/${p.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const products = await withFallback(() => searchProducts({ pageSize: 48 }), {
    items: [],
    total: 0,
    page: 1,
    pageSize: 48,
    hasMore: false,
  });
  return [
    ...pages,
    ...collections,
    ...products.items.map((p) => ({
      url: `${siteUrl}/shop/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
