"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { adjustOrderLinesAction, markOrderReviewedAction, relinkOrderAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

interface Line {
  id: string;
  label: string;
  eligible: number;
}

/** Owner corrections for one order: relink it, adjust eligible quantities, mark it reviewed. Every change is audited. */
export function OrderTools({ orderId, userId, lines }: { orderId: string; userId: string | null; lines: Line[] }) {
  const id = useId();
  const [user, setUser] = useState(userId ?? "");
  const [linkReason, setLinkReason] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>(Object.fromEntries(lines.map((l) => [l.id, l.eligible])));
  const [adjustReason, setAdjustReason] = useState("");
  const link = useOwnerAction();
  const adjust = useOwnerAction();
  const review = useOwnerAction();

  function relink(e: FormEvent) {
    e.preventDefault();
    const target = user.trim() || null;
    link.run(() => relinkOrderAction({ orderId, userId: target, reason: linkReason }), target ? "Relinked." : "Unlinked.");
  }

  function adjustLines(e: FormEvent) {
    e.preventDefault();
    const changes = lines.map((l) => ({ lineId: l.id, eligibleQuantity: quantities[l.id] ?? 0 }));
    adjust.run(() => adjustOrderLinesAction({ orderId, lines: changes, reason: adjustReason }), "Adjusted.");
  }

  return (
    <div className="admin-editor">
      <form onSubmit={relink} className="field" noValidate>
        <label htmlFor={`${id}-user`} className="aw-label">
          Account (user id, blank to unlink)
        </label>
        <input id={`${id}-user`} className="aw-input" value={user} onChange={(e) => setUser(e.target.value)} />
        <label htmlFor={`${id}-link-reason`} className="aw-label">
          Reason
        </label>
        <input id={`${id}-link-reason`} className="aw-input" maxLength={300} value={linkReason} onChange={(e) => setLinkReason(e.target.value)} />
        <div>
          <Button variant="secondary" type="submit" disabled={link.busy || linkReason.trim().length < 3}>
            Relink
          </Button>
        </div>
        <Outcome message={link.message} failed={link.failed} />
      </form>

      {lines.length > 0 ? (
        <form onSubmit={adjustLines} className="field" noValidate>
          {lines.map((l) => (
            <div key={l.id} className="admin-inline">
              <label htmlFor={`${id}-${l.id}`} className="aw-label">
                {l.label}
              </label>
              <input
                id={`${id}-${l.id}`}
                type="number"
                min={0}
                max={100}
                className="aw-input"
                value={quantities[l.id] ?? 0}
                onChange={(e) => setQuantities((q) => ({ ...q, [l.id]: Number(e.target.value) || 0 }))}
              />
            </div>
          ))}
          <label htmlFor={`${id}-adjust-reason`} className="aw-label">
            Reason
          </label>
          <input id={`${id}-adjust-reason`} className="aw-input" maxLength={300} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
          <div>
            <Button variant="secondary" type="submit" disabled={adjust.busy || adjustReason.trim().length < 3}>
              Adjust eligible quantities
            </Button>
          </div>
          <Outcome message={adjust.message} failed={adjust.failed} />
        </form>
      ) : null}

      <div className="field">
        <div>
          <Button variant="secondary" disabled={review.busy} onClick={() => review.run(() => markOrderReviewedAction({ orderId }), "Marked reviewed.")}>
            Mark reviewed
          </Button>
        </div>
        <Outcome message={review.message} failed={review.failed} />
      </div>
    </div>
  );
}
