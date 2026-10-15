import {
  FOUNDING_LINE,
  OPEN_TO_ALL,
  SIGNUP_ALONE,
  freeBenefits,
  purchaseBenefits,
  type ArchiveOffer,
} from "./offer";

/**
 * What an account brings, in two groups kept apart: what is free with the account, and what each
 * design bought with it opens. Every line comes from the offer, so only working features appear.
 */
export function BenefitsList({ offer }: { offer: ArchiveOffer }) {
  const free = freeBenefits(offer);
  const purchase = purchaseBenefits(offer);
  if (free.length === 0) return null;
  return (
    <div className="archive-benefits">
      <div className="archive-benefits-head">
        <h2 className="aw-h2">Your pieces. Their meaning. One Archive.</h2>
        <p className="aw-body">
          My Archive brings your Awebound pieces and their meaning together.
        </p>
      </div>
      <section className="archive-benefit-group" aria-labelledby="free-title">
        <h3 id="free-title" className="aw-h3">
          Free with your account
        </h3>
        <ul>
          {free.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>
      {purchase.length > 0 ? (
        <section className="archive-benefit-group" aria-labelledby="purchase-title">
          <h3 id="purchase-title" className="aw-h3">
            With each design you buy
          </h3>
          <ul>
            {purchase.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="aw-small">{SIGNUP_ALONE}</p>
        </section>
      ) : null}
      <div className="archive-benefits-notes">
        <p className="aw-small">{OPEN_TO_ALL}</p>
        {offer.foundingOpen ? <p className="aw-small">{FOUNDING_LINE}</p> : null}
      </div>
    </div>
  );
}
