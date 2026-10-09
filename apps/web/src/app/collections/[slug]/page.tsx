import { notFound, redirect } from "next/navigation";
import { getReleases, withFallback } from "@/server/catalog";

type Params = Promise<{ slug: string }>;

/** A named release's own address, e.g. /collections/behold: the shop filtered to it. */
export default async function CollectionPage({ params }: { params: Params }) {
  const { slug } = await params;
  const releases = await withFallback(getReleases, []);
  if (!releases.some((r) => r.slug === slug)) notFound();
  redirect(`/shop?collection=${encodeURIComponent(slug)}`);
}
