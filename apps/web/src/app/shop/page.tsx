import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { CatalogView } from "@/features/catalog/catalog-view";
import type { RawSearchParams } from "@/features/catalog/query";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Tees, oversized tees, tanks and caps carrying engraved art and Scripture. Search by design, verse or color.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <div className="aw-container">
      <PageHeader
        eyebrow="Shop"
        title="The collection"
        intro="Every piece carries a symbol and a reference. Find yours by design, verse or color."
      />
      <CatalogView searchParams={await searchParams} basePath="/shop" />
    </div>
  );
}
