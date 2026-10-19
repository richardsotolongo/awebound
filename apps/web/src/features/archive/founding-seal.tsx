import { ThornCross } from "@awebound/brand";
import Link from "next/link";

/** An understated mark on the overview, linking to the Founding tab. No rank or count here. */
export function FoundingSeal() {
  return (
    <div className="archive-seal">
      <span className="archive-seal-mark">
        <ThornCross size="small" height={40} title="" />
      </span>
      <div>
        <p className="aw-h3">Founding Member</p>
        <p className="aw-small">
          Recognition for an early purchase made with your Awebound account.{" "}
          <Link href="/account/founding">See what it includes</Link>
        </p>
      </div>
    </div>
  );
}
