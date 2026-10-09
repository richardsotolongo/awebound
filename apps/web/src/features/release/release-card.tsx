import { ProductCard } from "@awebound/brand";
import type { ProductSummary } from "@/shared";
import { toCardProps } from "@/features/catalog/query";
import { toNumeral, visionFor } from "@/lib/release";

/** A product card with its place in the release above it: "III · Sacrifice". */
export function ReleaseCard({
  product,
  priority,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const vision = visionFor(product.slug);
  const numeral = vision?.numeral ?? toNumeral(product.position);
  return (
    <div className="release-card">
      <p className="release-card-num aw-label">
        <span>{numeral}</span>
        {vision ? ` · ${vision.theme}` : null}
      </p>
      <ProductCard {...toCardProps(product, priority)} />
    </div>
  );
}
