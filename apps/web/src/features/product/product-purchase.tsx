"use client";

import { Button, SizeSelector, Swatches } from "@awebound/brand";
import { colorCss, formatPrice, type ProductDetail } from "@/shared";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Sheet } from "@/components/sheet";
import { useBag } from "@/features/bag/bag-store";
import { NotifyForm } from "@/features/bag/notify-form";
import { priceLabel } from "@/features/catalog/query";
import { SaveHeart } from "@/features/archive/save-heart";
import { DeliverySummary } from "./delivery-summary";
import { SizeGuide } from "./size-guide";

/**
 * Garment type and price, the piece's Scripture (`children`), color, size and the bag button,
 * then delivery and returns in brief. The price is the base price; choosing a size that costs
 * more (2XL and up) updates it and says so under the sizes. On phones the price and the button
 * stay within reach in a bar once the button has scrolled away, until the page turns to the
 * other pieces.
 */
export function ProductPurchase({
  product,
  children,
}: {
  product: ProductDetail;
  children?: ReactNode;
}) {
  const add = useBag((s) => s.add);
  const openBag = useBag((s) => s.open);
  const [color, setColor] = useState(product.baseColor);
  const oneSize = product.sizes.length === 1 ? product.sizes[0] : undefined;
  const [size, setSize] = useState<string | undefined>(oneSize);
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  // Where the page is, for the phone bar: past the bag button, and not yet at the other pieces.
  const [past, setPast] = useState(false);
  const [atOthers, setAtOthers] = useState(false);

  useEffect(() => {
    const action = actionRef.current;
    const others = document.getElementById("other-pieces");
    if (!action) return;
    const above = (e: IntersectionObserverEntry) =>
      !e.isIntersecting && e.boundingClientRect.top < 0;
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === action) setPast(above(e));
        else setAtOthers(e.isIntersecting || above(e));
      }
    });
    observer.observe(action);
    if (others) observer.observe(others);
    return () => observer.disconnect();
  }, []);

  const variantsForColor = useMemo(
    () => product.variants.filter((v) => v.color === color),
    [product.variants, color],
  );
  const soldOutSizes = variantsForColor.filter((v) => !v.available).map((v) => v.size);
  const allSoldOut = variantsForColor.length > 0 && soldOutSizes.length === variantsForColor.length;
  const variant = variantsForColor.find((v) => v.size === size);
  // Until a size is chosen the price is the base price.
  const price = variant ? formatPrice(variant.priceCents, product.currency) : priceLabel(product);
  // A size that costs more than the base price (2XL and up) says so once it's chosen.
  const extraCents = variant ? variant.priceCents - product.priceCents : 0;

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
      // Focusing the first size also brings the sizes back into view from the phone bar.
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
      preview: product.preview,
    });
    openBag();
  }

  return (
    <>
      <p className="buy-row">
        <span>{product.category.cut}</span>
        <span className="buy-price">{price}</span>
      </p>
      {children}

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
          <Button variant="link" onClick={() => setGuideOpen(true)} aria-haspopup="dialog">
            Size guide
          </Button>
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
        {product.sizeGuide?.note ? (
          <p className="buy-size-note aw-small">{product.sizeGuide.note}</p>
        ) : null}
        <p className="buy-size-price" aria-live="polite">
          {variant && extraCents > 0
            ? `${variant.size} is ${price}, ${formatPrice(extraCents, product.currency)} more than other sizes.`
            : null}
        </p>
        {error ? (
          <p className="buy-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div ref={actionRef} className="buy-action">
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
        <SaveHeart slug={product.slug} name={product.name} variant="page" />
      </div>

      <DeliverySummary process={product.story.process} onSizeGuide={() => setGuideOpen(true)} />

      {allSoldOut ? null : (
        <div className="buy-bar" data-on={past && !atOthers} inert={!(past && !atOthers)}>
          <p className="buy-bar-words">
            <span className="buy-bar-name">{product.name}</span>
            <span className="buy-price">{price}</span>
          </p>
          <Button variant="primary" onClick={addToBag}>
            Add to bag
          </Button>
        </div>
      )}

      <Sheet
        id="size-guide"
        size={product.sizeGuide?.image ? "wide" : undefined}
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title={`${product.category.cut} size guide`}
      >
        <SizeGuide guide={product.sizeGuide} cut={product.category.cut} />
      </Sheet>
    </>
  );
}
