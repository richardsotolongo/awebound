import Link from "next/link";
import { DELIVERY } from "@/lib/delivery";

interface DeliverySummaryProps {
  /** Ordering isn't open yet: delivery details are confirmed before it opens. */
  preview: boolean;
  /** "embroidered" for caps, "printed" for everything else. */
  process: "printed" | "embroidered";
  onSizeGuide?: () => void;
}

/**
 * Delivery and returns, in brief, beside the buying controls: made to order, production and
 * shipping times (stated separately), how shipping is charged, and the difference between a
 * problem with an order and a size that doesn't fit. Shows only confirmed details.
 */
export function DeliverySummary({ preview, process, onSizeGuide }: DeliverySummaryProps) {
  const pending = "Confirmed before ordering opens";
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
          <dd>{!preview && DELIVERY.productionTime ? DELIVERY.productionTime : pending}</dd>
        </div>
        <div>
          <dt>Shipping time</dt>
          <dd>
            {!preview && DELIVERY.shippingTime
              ? `${DELIVERY.shippingTime}, after production`
              : "Estimated before ordering opens"}
          </dd>
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
            Misprinted, damaged or the wrong item? Tell us within {DELIVERY.problemWindowDays} days
            of delivery, with a photo, and we’ll replace it or refund you.
          </dd>
        </div>
        <div>
          <dt>A size that doesn’t fit</dt>
          <dd>
            Because each piece is made for you, we can’t take returns or exchanges for size. Check
            the size guide first, or ask us before you order.
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
          Return policy
        </Link>
      </p>
    </section>
  );
}
