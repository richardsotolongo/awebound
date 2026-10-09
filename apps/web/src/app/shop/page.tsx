import type { Metadata } from "next";
import { CatalogView, resolveCollection } from "@/features/catalog/catalog-view";
import type { RawSearchParams } from "@/features/catalog/query";
import { ShopHeader } from "@/features/catalog/shop-header";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop Awebound: Christian apparel rooted in Scripture. Browse the latest drop or every collection, by tees, oversized tees, hoodies and hats.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const view = await resolveCollection(params);
  return (
    <div className="aw-container shop">
      <ShopHeader view={view} />
      <CatalogView searchParams={params} basePath="/shop" view={view} />
    </div>
  );
}
