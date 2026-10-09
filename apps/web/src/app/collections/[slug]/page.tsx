import { CollectionBanner } from "@awebound/brand";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/features/catalog/catalog-view";
import type { RawSearchParams } from "@/features/catalog/query";
import { PILLARS } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return PILLARS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const pillar = PILLARS.find((p) => p.slug === slug);
  if (!pillar) return { title: "Not found" };
  return {
    title: pillar.family,
    description: `${pillar.story} ${pillar.scripture}.`,
    alternates: { canonical: `/collections/${pillar.slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<RawSearchParams>;
}) {
  const { slug } = await params;
  const pillar = PILLARS.find((p) => p.slug === slug);
  if (!pillar) notFound();

  return (
    <>
      <CollectionBanner
        as="h1"
        family={pillar.family}
        pillar={`${pillar.pillar} · ${pillar.scripture}`}
        story={pillar.story}
        tone="feature"
      />
      <div className="aw-container" style={{ paddingTop: "var(--space-8)" }}>
        <CatalogView
          searchParams={await searchParams}
          basePath={`/collections/${pillar.slug}`}
          collection={pillar.slug}
        />
      </div>
    </>
  );
}
