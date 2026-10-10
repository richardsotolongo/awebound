"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { updateProfile } from "@/server/actions";

export function ProfileForm({ initialName }: { initialName: string }) {
  const id = useId();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    setState("saving");
    const result = await updateProfile({ fullName: name }).catch(() => null);
    if (result?.ok) {
      setName(result.data.fullName);
      setSavedName(result.data.fullName);
      setState("saved");
    } else {
      setState("error");
      setError(result?.error ?? "That didn’t save. Try again.");
    }
  }

  return (
    <form onSubmit={save} className="field" noValidate>
      <label htmlFor={`${id}-name`} className="aw-label">
        Name
      </label>
      <div className="aw-footer-row">
        <input
          id={`${id}-name`}
          className="aw-input"
          autoComplete="name"
          value={name}
          maxLength={120}
          onChange={(e) => {
            setName(e.target.value);
            setState("idle");
          }}
        />
        <Button
          variant="secondary"
          type="submit"
          disabled={state === "saving" || name.trim() === "" || name === savedName}
        >
          {state === "saving" ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="field-help" role="status" aria-live="polite">
        {state === "saved" ? "Saved." : state === "error" ? error : ""}
      </p>
    </form>
  );
}
