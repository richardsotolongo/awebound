import { ThornCross } from "@awebound/brand";

/** An understated mark on the overview. No rank, no count, no perks. */
export function FoundingSeal() {
  return (
    <div className="archive-seal">
      <span className="archive-seal-mark">
        <ThornCross size="small" height={40} title="" />
      </span>
      <div>
        <p className="aw-h3">Founding Member</p>
        <p className="aw-small">
          Recognition for an early purchase made with your Awebound account.
        </p>
      </div>
    </div>
  );
}
