"use client";

import { Button } from "@awebound/brand";
import { importDraftsAction, reconcileNowAction, sendQueuedEmailsAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

/** Seeds the ten drafts as unpublished rows; idempotent, so it is safe to press again. */
export function ImportDraftsButton() {
  const { busy, message, failed, run } = useOwnerAction();
  return (
    <div className="field">
      <div>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() =>
            run(importDraftsAction, (r) => {
              const problems = r.mismatches.map((m) => `${m.slug}: ${m.problems.join("; ")}`).join(" ");
              return `Inserted ${r.inserted.length}, skipped ${r.skipped.length}, ${r.mismatches.length} mismatched. ${problems}`.trim();
            })
          }
        >
          {busy ? "Importing…" : "Import the ten drafts"}
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </div>
  );
}

export function ReconcileButton({ enabled }: { enabled: boolean }) {
  const { busy, message, failed, run } = useOwnerAction();
  return (
    <div className="field">
      <div>
        <Button
          variant="secondary"
          disabled={busy || !enabled}
          onClick={() =>
            run(reconcileNowAction, (r) => {
              const walked = r.listedAll ? ", walked the provider’s list" : "";
              const error = r.error ? ` Error: ${r.error}` : "";
              return `Checked ${r.checked}, changed ${r.changed}${walked}, settled ${r.settled} Founding places.${error}`;
            })
          }
        >
          {busy ? "Checking…" : "Reconcile orders now"}
        </Button>
      </div>
      {enabled ? null : <p className="field-help">Needs the API user (FOURTHWALL_API_USERNAME and FOURTHWALL_API_PASSWORD).</p>}
      <Outcome message={message} failed={failed} />
    </div>
  );
}

export function SendQueuedButton() {
  const { busy, message, failed, run } = useOwnerAction();
  return (
    <div className="field">
      <div>
        <Button variant="secondary" disabled={busy} onClick={() => run(sendQueuedEmailsAction, (r) => `Sent ${r.sent}.`)}>
          {busy ? "Sending…" : "Send queued emails"}
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </div>
  );
}
