import { ProductCard } from "@awebound/brand";
import type { ProductSummary } from "@/shared";
import { toCardProps } from "@/features/catalog/query";

/**
 * A piece in a grid: the whole garment, the name, its type and price, and its Scripture. `tile`
 * leaves the Scripture out, for the wall, where a column is too narrow to quote it in full.
 */
export function ReleaseCard({
  product,
  priority,
  tile,
  nameOnLeave,
}: {
  product: ProductSummary;
  priority?: boolean;
  tile?: boolean;
  /** On a product page: name the image for the morph only once this card is followed. */
  nameOnLeave?: boolean;
}) {
  const props = toCardProps(product, priority);
  return (
    <ProductCard
      {...props}
      quote={tile ? undefined : props.quote}
      transitionWhen={nameOnLeave ? "leaving" : "always"}
    />
  );
}
