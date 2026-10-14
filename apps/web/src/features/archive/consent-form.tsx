"use client";

import { useId, useState } from "react";
import { setEmailConsent } from "@/server/archive-actions";

/** Optional collection updates. Never pre-checked; the choice is stored with its wording. */
export function ConsentForm({ initial, wording }: { initial: boolean; wording: string }) {
  const id = useId();
  const [checked, setChecked] = useState(initial);
  const [status, setStatus] = useState("");
  async function change(next: boolean) {
    setChecked(next);
    setStatus("");
    const result = await setEmailConsent({ topic: "collection_updates", consented: next }).catch(
      () => null,
    );
    if (result?.ok) setStatus("Saved.");
    else {
      setChecked(!next);
      setStatus(result?.error ?? "That didn’t save. Try again.");
    }
  }
  return (
    <div className="field">
      <label
        htmlFor={`${id}-consent`}
        className="aw-body"
        style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}
      >
        <input
          id={`${id}-consent`}
          type="checkbox"
          checked={checked}
          onChange={(e) => change(e.target.checked)}
          style={{ marginTop: 6 }}
        />
        <span>{wording}</span>
      </label>
      <p className="field-help">Optional. This never affects your account or purchases.</p>
      <p className="field-help" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
