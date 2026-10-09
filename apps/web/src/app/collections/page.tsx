import { CollectionBanner, ThornRule } from "@awebound/brand";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Reveal } from "@/components/reveal";
import { PILLARS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Royal Heritage, Broken Bond and Rolled Away: three families, one for each Awebound pillar.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsPage() {
  return (
    <>
      <div className="aw-container">
        <PageHeader
          eyebrow="Collections"
          title="Three pillars, three families"
          intro="Every Awebound design belongs to one of three families. Each carries its own symbols and its own Scripture."
        />
      </div>
      <div style={{ display: "grid", gap: "var(--space-1)", paddingBottom: "var(--space-24)" }}>
        {PILLARS.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.05}>
            <CollectionBanner
              family={p.family}
              pillar={`${p.pillar} · ${p.scripture}`}
              story={p.story}
              action={{ label: `Shop ${p.family}`, href: `/collections/${p.slug}` }}
            />
          </Reveal>
        ))}
        <div className="aw-container" style={{ paddingTop: "var(--space-16)" }}>
          <ThornRule />
        </div>
      </div>
    </>
  );
}
