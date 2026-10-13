"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { verifyCareAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

/** Care instructions are verified by the owner from a named source, never guessed. */
export function CareForm({ designKey, initialInstructions, initialSource }: { designKey: string; initialInstructions: string; initialSource: string }) {
  const id = useId();
  const [instructions, setInstructions] = useState(initialInstructions);
  const [source, setSource] = useState(initialSource);
  const { busy, message, failed, run } = useOwnerAction();

  function submit(e: FormEvent) {
    e.preventDefault();
    run(() => verifyCareAction({ designKey, instructions, source }), "Care verified.");
  }

  return (
    <form onSubmit={submit} className="admin-editor" noValidate>
      <div className="field">
        <label htmlFor={`${id}-care`} className="aw-label">
          Care instructions
        </label>
        <textarea id={`${id}-care`} className="aw-textarea" maxLength={1000} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        <p className="field-help">{instructions.length}/1000</p>
      </div>
      <div className="field">
        <label htmlFor={`${id}-source`} className="aw-label">
          Source (where they come from)
        </label>
        <input id={`${id}-source`} className="aw-input" maxLength={200} value={source} onChange={(e) => setSource(e.target.value)} />
      </div>
      <div>
        <Button variant="secondary" type="submit" disabled={busy || !instructions.trim() || !source.trim()}>
          {busy ? "Saving…" : "Verify care"}
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </form>
  );
}
