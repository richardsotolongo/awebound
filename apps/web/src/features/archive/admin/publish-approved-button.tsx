"use client";

import { Button } from "@awebound/brand";
import { publishContentAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

/** Publishes every approved draft at once. The page’s one primary button. */
export function PublishApprovedButton({ designKeys }: { designKeys: string[] }) {
  const { busy, message, failed, run } = useOwnerAction();
  return (
    <div className="field">
      <div>
        <Button
          disabled={busy || designKeys.length === 0}
          onClick={() =>
            run(
              () => publishContentAction({ designKeys }),
              (r) => `Published ${r.published.length}.`,
            )
          }
        >
          {busy
            ? "Publishing…"
            : designKeys.length > 0
              ? `Publish all approved (${designKeys.length})`
              : "Publish all approved"}
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </div>
  );
}
