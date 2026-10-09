"use client";

import { Button, SizeSelector, Swatches } from "@awebound/brand";
import { colorCss, formatPrice, type ProductDetail } from "@/shared";
import { useMemo, useRef, useState } from "react";
import { Sheet } from "@/components/sheet";
import { useBag } from "@/features/bag/bag-store";
import { NotifyForm } from "@/features/bag/notify-form";
import { SizeGuide } from "./size-guide";

/** Color, size and Add to bag. Adding opens the bag so the next step is always one tap away. */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const add = useBag((s) => s.add);
  const openBag = useBag((s) => s.open);
  const [color, setColor] = useState(product.baseColor);
  const oneSize = product.sizes.length === 1 ? product.sizes[0] : undefined;
  const [size, setSize] = useState<string | undefined>(oneSize);
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);

  const variantsForColor = useMemo(
    () => product.variants.filter((v) => v.color === color),
    [product.variants, color],
  );
  const soldOutSizes = variantsForColor.filter((v) => !v.available).map((v) => v.size);
  const allSoldOut = variantsForColor.length > 0 && soldOutSizes.length === variantsForColor.length;
  const variant = variantsForColor.find((v) => v.size === size);
  const price = variant?.priceCents ?? product.priceCents;

  function changeColor(next: string) {
    setColor(next);
    setError("");
    const stillAvailable = product.variants.some(
      (v) => v.color === next && v.size === size && v.available,
    );
    if (!stillAvailable && !oneSize) setSize(undefined);
  }

  function addToBag() {
    if (!variant || !variant.available) {
      setError("Choose a size.");
      sizesRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
      return;
    }
    add({
      sku: variant.sku,
      productSlug: product.slug,
      code: product.code,
      name: product.name,
      cut: product.category.cut,
      color: variant.color,
      size: variant.size,
      image: product.image,
      unitPriceCents: variant.priceCents,
      available: true,
    });
    openBag();
  }

  return (
    <>
      <p className="buy-price">{formatPrice(price, product.currency)}</p>

      <div className="buy-option">
        <div className="buy-option-head">
          <span className="aw-label">Color</span>
        </div>
        <Swatches
          colors={product.colors.map((c) => ({ name: c.name, hex: colorCss(c) }))}
          value={color}
          onChange={changeColor}
        />
      </div>

      <div className="buy-option">
        <div className="buy-option-head">
          <span className="aw-label">Size</span>
          {product.category.slug !== "hats" ? (
            <Button variant="link" onClick={() => setGuideOpen(true)} aria-haspopup="dialog">
              Size guide
            </Button>
          ) : null}
        </div>
        <div ref={sizesRef}>
          <SizeSelector
            sizes={product.sizes}
            value={size}
            unavailable={soldOutSizes}
            onChange={(s) => {
              setSize(s);
              setError("");
            }}
          />
        </div>
        {error ? (
          <p className="buy-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {allSoldOut ? (
        <div className="notice">
          <p className="aw-small" style={{ color: "var(--ink)" }}>
            Sold out in {color}. We’ll tell you when it’s back.
          </p>
          <NotifyForm source="product" productSlug={product.slug} label="Your email" />
        </div>
      ) : (
        <Button variant="primary" block onClick={addToBag}>
          Add to bag
        </Button>
      )}

      <Sheet
        id="size-guide"
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title={`${product.category.cut} size guide`}
      >
        <SizeGuide category={product.category.slug} cut={product.category.cut} />
      </Sheet>
    </>
  );
}
