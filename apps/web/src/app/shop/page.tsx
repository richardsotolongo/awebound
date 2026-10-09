import type { Metadata } from "next";
import { CatalogView } from "@/features/catalog/catalog-view";
import type { RawSearchParams } from "@/features/catalog/query";
import { ReleaseHeader } from "@/features/release/release-header";
import { RELEASE } from "@/lib/release";

export const metadata: Metadata = {
  title: `Shop ${RELEASE.name}`,
  description: `${RELEASE.name}, the first Awebound release: five tees and a cap. ${RELEASE.tagline}`,
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <div className="aw-container">
      <ReleaseHeader />
      <CatalogView searchParams={await searchParams} basePath="/shop" />
    </div>
  );
}
