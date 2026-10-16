import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { indexablePages } from "@/server/indexable";
import { indexNowDates } from "@/server/indexnow";

export const revalidate = 3600;

/**
 * Every indexable address (server/indexable.ts). A page's date is the last time IndexNow saw
 * what a reader sees on it change, so Google, which doesn't take IndexNow, gets the same signal;
 * a piece not sent yet keeps its release date.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, dates] = await Promise.all([indexablePages(), indexNowDates()]);
  return pages.map(({ path, lastModified, images }) => {
    const url = `${siteUrl}${path}`;
    return {
      // Next writes the address into the XML as it is, so the "&" between two params is escaped here.
      url: url.replace(/&/g, "&amp;"),
      lastModified: dates.get(url) ?? lastModified,
      ...(images ? { images } : {}),
    };
  });
}
