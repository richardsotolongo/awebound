import { FOUNDING_LINE, OPEN_TO_ALL, freeLine, purchaseLine, type ArchiveOffer } from "./offer";

/**
 * Sign-in: what the account brings, as two brief distinctions kept apart: what is free with the
 * account, and what a verified purchase opens for its design. Every line comes from the offer, so
 * only working features appear; the purchase line waits until a purchase can open a story.
 */
export function BenefitsList({ offer }: { offer: ArchiveOffer }) {
  const free = freeLine(offer);
  const purchase = purchaseLine(offer);
  if (!free) return null;
  return (
    <div className="archive-benefits">
      <h2 className="aw-h2">
        {purchase ? "Wear the piece. Know its story." : "Keep the pieces you love."}
      </h2>
      <section className="archive-benefit-group" aria-labelledby="free-title">
        <h3 id="free-title" className="aw-h3">
          Free with your account
        </h3>
        <p className="aw-body">{free}</p>
      </section>
      {purchase ? (
        <section className="archive-benefit-group" aria-labelledby="purchase-title">
          <h3 id="purchase-title" className="aw-h3">
            With each design you buy
          </h3>
          <p className="aw-body">{purchase}</p>
        </section>
      ) : null}
      <div className="archive-benefits-notes">
        <p className="aw-small">{OPEN_TO_ALL}</p>
        {offer.foundingOpen ? <p className="aw-small">{FOUNDING_LINE}</p> : null}
      </div>
    </div>
  );
}
