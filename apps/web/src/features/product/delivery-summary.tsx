import Link from "next/link";
import { DELIVERY } from "@/lib/delivery";

interface DeliverySummaryProps {
  /** The piece can't be ordered yet: delivery details are confirmed before it can. */
  preview: boolean;
  /** How the piece's art goes on (the product story's `process`). */
  process: "printed" | "embroidered";
  onSizeGuide?: () => void;
}

/**
 * Delivery and returns, in brief, beside the buying controls: made to order, production and
 * shipping times (stated separately), how shipping is charged, and the difference between a
 * problem with an order and a size that doesn't fit. Shows only confirmed details.
 */
export function DeliverySummary({ preview, process, onSizeGuide }: DeliverySummaryProps) {
  // Times show only once confirmed (lib/delivery.ts). Until then a preview says they come before
  // ordering opens; a piece that can already be ordered says to ask.
  const ask = "Not confirmed yet. Ask us before you order if timing matters.";
  const production = preview ? "Confirmed before ordering opens" : (DELIVERY.productionTime ?? ask);
  const shipping = preview
    ? "Estimated before ordering opens"
    : DELIVERY.shippingTime
      ? `${DELIVERY.shippingTime}, after production`
      : ask;
  return (
    <section className="delivery" aria-labelledby="delivery-title">
      <h2 id="delivery-title" className="aw-label">
        Delivery and returns
      </h2>
      <dl className="delivery-list">
        <div>
          <dt>Made to order</dt>
          <dd>Each piece is {process} for you after you order it.</dd>
        </div>
        <div>
          <dt>Production time</dt>
          <dd>{production}</dd>
        </div>
        <div>
          <dt>Shipping time</dt>
          <dd>{shipping}</dd>
        </div>
        <div>
          <dt>Shipping cost</dt>
          <dd>
            Calculated at checkout for your address and shown before you pay.
            {preview ? " Rates are confirmed before ordering opens." : ""}
          </dd>
        </div>
        <div>
          <dt>A problem with your order</dt>
          <dd>
            Damaged, misprinted or defective, or not what you ordered (the wrong item or size)? Tell
            us within {DELIVERY.problemWindowDays} days of delivery, with a photo, and we’ll send a
            replacement at no cost to you, or refund you if a replacement isn’t possible.
          </dd>
        </div>
        <div>
          <dt>A size that doesn’t fit</dt>
          <dd>
            Because each piece is made for you, we can’t take returns or exchanges for a size you
            chose. Check the size guide first, or ask us before you order.
          </dd>
        </div>
      </dl>
      <p className="delivery-links">
        {onSizeGuide ? (
          <button type="button" className="aw-btn aw-btn-link" onClick={onSizeGuide}>
            Size guide
          </button>
        ) : null}
        <Link href="/refunds" className="aw-btn aw-btn-link">
          Returns and refunds
        </Link>
      </p>
    </section>
  );
}
