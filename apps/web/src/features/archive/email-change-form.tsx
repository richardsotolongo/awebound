"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Changing the sign-in address: both the current and the new address confirm it (Supabase Auth). */
export function EmailChangeForm({ current }: { current: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email)) {
      setError("Enter an email address like you@example.com.");
      setState("error");
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setState("sending");
    setError("");
    const { error: err } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/account/settings?changed=email` },
    );
    if (err) {
      setState("error");
      setError(err.status === 429 ? "Too many requests. Wait a minute and try again." : "We couldn’t start the change. Check the address and try again.");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="notice" role="status">
        <p className="aw-small" style={{ color: "var(--ink)" }}>
          Check both inboxes to finish the change: {current} and {email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="field" noValidate>
      <label htmlFor={`${id}-email`} className="aw-label">
        New email
      </label>
      <div className="aw-footer-row">
        <input
          id={`${id}-email`}
          className="aw-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setState("idle");
          }}
          aria-invalid={state === "error"}
          aria-describedby={state === "error" ? `${id}-error` : `${id}-help`}
        />
        <Button variant="secondary" type="submit" disabled={state === "sending" || !email}>
          {state === "sending" ? "Sending…" : "Change email"}
        </Button>
      </div>
      <p id={`${id}-help`} className="field-help">
        We’ll send a confirmation to both your current and your new address. Your saved pieces, fit
        and purchases stay with your account.
      </p>
      {state === "error" && error ? (
        <p id={`${id}-error`} className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
