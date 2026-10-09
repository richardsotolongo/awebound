"use client";

import { Button } from "@awebound/brand";
import { ApiError } from "@awebound/shared";
import { useId, useState, type FormEvent } from "react";
import { api } from "@/lib/api";

export function ProfileForm({ initialName }: { initialName: string }) {
  const id = useId();
  const [name, setName] = useState(initialName);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    setState("saving");
    try {
      const profile = await api.updateMe({ fullName: name });
      setName(profile.fullName ?? "");
      setState("saved");
    } catch (err) {
      setState("error");
      setError(err instanceof ApiError ? err.message : "That didn’t save. Try again.");
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
          disabled={state === "saving" || name.trim() === "" || name === initialName}
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
