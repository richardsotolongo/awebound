import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/bag", "/auth/", "/sign-in"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
