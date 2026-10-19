"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Changing the sign-in address: a button first, so the address field only shows once someone
 * means to change it. Both the current and the new address confirm it (Supabase Auth).
 */
export function EmailChangeForm({ current }: { current: string }) {
  const id = useId();
  const [editing, setEditing] = useState(false);
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
      setError(
        err.status === 429
          ? "Too many requests. Wait a minute and try again."
          : "We couldn’t start the change. Check the address and try again.",
      );
      return;
    }
    track("email_change_requested");
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

  if (!editing) {
    return (
      <div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Change email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="field" noValidate>
      <label htmlFor={`${id}-email`} className="aw-label">
        New email address
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
          autoFocus
        />
        <Button variant="secondary" type="submit" disabled={state === "sending" || !email}>
          {state === "sending" ? "Sending…" : "Send confirmation"}
        </Button>
      </div>
      <p id={`${id}-help`} className="field-help">
        We’ll email both addresses to confirm. Your saved pieces and orders stay with your account.
      </p>
      <div>
        <Button
          variant="link"
          onClick={() => {
            setEditing(false);
            setEmail("");
            setState("idle");
          }}
        >
          Cancel
        </Button>
      </div>
      {state === "error" && error ? (
        <p id={`${id}-error`} className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
