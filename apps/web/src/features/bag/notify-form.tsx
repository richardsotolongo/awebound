"use client";

import { Button } from "@awebound/brand";
import type { SubscribeRequest } from "@/shared";
import { useId, useState, type FormEvent } from "react";
import { subscribe } from "@/server/actions";

interface NotifyFormProps {
  source: SubscribeRequest["source"];
  productSlug?: string;
  label?: string;
  help?: string;
}

/** Email capture for drop notes and "tell me when this is back". */
export function NotifyForm({ source, productSlug, label = "Email", help }: NotifyFormProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const result = await subscribe({ email, source, productSlug }).catch(() => null);
    if (result?.ok) {
      setState("done");
    } else {
      setState("error");
      setError(
        result?.fields?.email ?? result?.error ?? "That didn’t go through. Try again in a moment.",
      );
    }
  }

  if (state === "done") {
    return (
      <p className="aw-small" role="status">
        You’re on the list. We’ll email you the moment it’s ready.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="field" noValidate>
      <label htmlFor={id} className="aw-label">
        {label}
      </label>
      {help ? <p className="field-help">{help}</p> : null}
      <div className="aw-footer-row">
        <input
          id={id}
          className="aw-input"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={state === "error"}
          aria-describedby={state === "error" ? `${id}-error` : undefined}
        />
        <Button variant="secondary" type="submit" disabled={state === "sending" || !email}>
          Notify me
        </Button>
      </div>
      {state === "error" ? (
        <p id={`${id}-error`} className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
