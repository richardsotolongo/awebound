"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { setFlagAction } from "@/server/admin-actions";
import type { FlagKey } from "@/shared";

/** One feature switch. The box reverts if the save fails. */
export function FlagToggle({ flagKey, enabled }: { flagKey: FlagKey; enabled: boolean }) {
  const id = useId();
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [status, setStatus] = useState("");

  async function change(next: boolean) {
    setChecked(next);
    setStatus("");
    const result = await setFlagAction({ key: flagKey, enabled: next }).catch(() => null);
    if (result?.ok) {
      setStatus("Saved.");
      router.refresh();
    } else {
      setChecked(!next);
      setStatus(result?.error ?? "That didn’t save. Try again.");
    }
  }

  return (
    <div className="admin-inline">
      <label htmlFor={`${id}-flag`} className="admin-check">
        <input
          id={`${id}-flag`}
          type="checkbox"
          checked={checked}
          onChange={(e) => change(e.target.checked)}
        />
        <span>{checked ? "On" : "Off"}</span>
      </label>
      <span className="field-help" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
