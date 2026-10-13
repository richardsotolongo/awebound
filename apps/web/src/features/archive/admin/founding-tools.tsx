"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { foundingCorrectionAction, settleFoundingAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

const ACTIONS = ["revoke", "restore", "award"] as const;
type Action = (typeof ACTIONS)[number];

/** Owner corrections to the seal, each with a reason, and the settlement of the contested places. */
export function FoundingTools() {
  const id = useId();
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState<Action>("revoke");
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const correct = useOwnerAction();
  const settle = useOwnerAction();

  function submit(e: FormEvent) {
    e.preventDefault();
    correct.run(
      () =>
        foundingCorrectionAction({
          userId: userId.trim(),
          action,
          reason,
          orderId: orderId.trim() || undefined,
        }),
      (r) => `Done: ${r.reason}.`,
    );
  }

  return (
    <div className="admin-editor">
      <form onSubmit={submit} className="field" noValidate>
        <label htmlFor={`${id}-user`} className="aw-label">
          User id
        </label>
        <input
          id={`${id}-user`}
          className="aw-input"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <label htmlFor={`${id}-action`} className="aw-label">
          Action
        </label>
        <select
          id={`${id}-action`}
          className="aw-select"
          value={action}
          onChange={(e) => setAction(ACTIONS.find((a) => a === e.target.value) ?? "revoke")}
        >
          <option value="revoke">Revoke</option>
          <option value="restore">Restore</option>
          <option value="award">Award</option>
        </select>
        <label htmlFor={`${id}-order`} className="aw-label">
          Order id (optional, for an award)
        </label>
        <input
          id={`${id}-order`}
          className="aw-input"
          maxLength={80}
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <label htmlFor={`${id}-reason`} className="aw-label">
          Reason
        </label>
        <input
          id={`${id}-reason`}
          className="aw-input"
          maxLength={300}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div>
          <Button
            variant="secondary"
            type="submit"
            disabled={correct.busy || !userId.trim() || reason.trim().length < 3}
          >
            Apply
          </Button>
        </div>
        <Outcome message={correct.message} failed={correct.failed} />
      </form>

      <div className="field">
        <div>
          <Button
            variant="secondary"
            disabled={settle.busy}
            onClick={() =>
              settle.run(settleFoundingAction, (r) => r.skipped ?? `Settled ${r.settled}.`)
            }
          >
            Settle contested places
          </Button>
        </div>
        <p className="field-help">
          Only after the provider’s order list has been walked in the last 24 hours.
        </p>
        <Outcome message={settle.message} failed={settle.failed} />
      </div>
    </div>
  );
}
