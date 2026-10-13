import type { ArchiveReadiness } from "@/server/archive/readiness";

/** The benefits an account brings, each claim shown only when it works today. */
export function purchaseBenefits(r: ArchiveReadiness): string[] {
  const out: string[] = [];
  if (r.content) out.push("Read the full story and founder note behind each design you own.");
  if (r.wallpapers && r.publishedAssets > 0)
    out.push("Download its published phone and desktop wallpapers.");
  if (r.pdf && r.share) out.push("Download a design card and create a branded story image.");
  else if (r.pdf) out.push("Download a design card.");
  else if (r.share) out.push("Create a branded story image.");
  return out;
}

export function immediateBenefits(r: ArchiveReadiness): string[] {
  const out = [
    "Save the pieces you want to return to.",
    "Remember your preferred sizes and view the right size guides.",
  ];
  if (r.orders) out.push("Keep your linked orders and purchased collection in one place.");
  return out;
}

export function BenefitsList({ readiness, headline = true }: { readiness: ArchiveReadiness; headline?: boolean }) {
  const purchase = purchaseBenefits(readiness);
  return (
    <div className="archive-benefits">
      {headline ? (
        <>
          <h2 className="aw-h2">Your pieces. Their meaning. One Archive.</h2>
          <p className="aw-body">
            Create a free Awebound account to save pieces, remember your fit, and keep your orders
            together. Each purchased design unlocks its full story, a note from Richard, and its
            published digital extras.
          </p>
        </>
      ) : null}
      <div>
        <h3 className="aw-h3">Right away</h3>
        <ul>
          {immediateBenefits(readiness).map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
      {purchase.length > 0 ? (
        <div>
          <h3 className="aw-h3">After a purchase</h3>
          <ul>
            {purchase.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {readiness.founding ? (
        <p className="aw-small">
          The first 50 qualifying buyers who use their Awebound account at checkout receive a
          Founding Member seal. Guest purchases do not qualify.
        </p>
      ) : null}
    </div>
  );
}
