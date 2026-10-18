import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ImportZip } from "@/features/catalog-admin/import-zip";
import { listCollections } from "@/server/catalog-admin/collections";

export const dynamic = "force-dynamic";
// Checking and importing a zip reads it whole and stores every image: give it time.
export const maxDuration = 300;
export const metadata: Metadata = { title: "Import a piece", robots: { index: false } };

export default async function ImportPiecePage() {
  const collections = await listCollections();
  return (
    <>
      <PageHeader
        title="Import a piece"
        intro="Upload one piece zip, choose its collection, check it, then create its drafts: the piece, its images, Archive copy, wallpapers and size guide."
      />
      <section className="admin-section">
        <ImportZip
          collections={collections.map((c) => ({
            slug: c.slug,
            name: c.name,
            number: c.number,
            position: c.position,
          }))}
        />
      </section>
    </>
  );
}
