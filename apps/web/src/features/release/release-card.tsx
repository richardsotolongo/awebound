import { ProductCard } from "@awebound/brand";
import type { ProductSummary } from "@/shared";
import { toCardProps } from "@/features/catalog/query";

/** A piece in a grid: the whole garment, its type and price, the name and its Scripture. */
export function ReleaseCard({
  product,
  priority,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  return <ProductCard {...toCardProps(product, priority)} />;
}
