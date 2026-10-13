"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { startOrderClaim, verifyOrderClaim } from "@/server/archive-actions";

/** Two steps: the order number, then the code sent to the email address on that order. */
export function ClaimOrderForm() {
  const id = useId();
  const [friendlyId, setFriendlyId] = useState("");
  const [claimId, setClaimId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [linked, setLinked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await startOrderClaim({ friendlyId }).catch(() => null);
    setBusy(false);
    if (result?.ok) setClaimId(result.data.claimId);
    else setError(result?.error ?? "That didn’t work. Try again in a moment.");
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!claimId) return;
    setBusy(true);
    setError("");
    const result = await verifyOrderClaim({ claimId, code }).catch(() => null);
    setBusy(false);
    if (result?.ok) setLinked(result.data.friendlyId);
    else setError(result?.error ?? "That code didn’t work. Check it, or start again.");
  }

  if (linked) {
    return (
      <div className="notice" role="status">
        <p className="aw-h3">Order {linked} is linked to your Archive.</p>
        <div>
          <Button variant="secondary" href="/account/orders">
            See your orders
          </Button>
        </div>
      </div>
    );
  }

  if (claimId) {
    return (
      <div style={{ display: "grid", gap: "var(--space-6)" }}>
        <div className="notice" role="status">
          <p className="aw-small" style={{ color: "var(--ink)" }}>
            If that order exists, a 6-digit code is on its way to the email address on it. It expires in 15 minutes.
          </p>
        </div>
        <form onSubmit={verify} className="field" noValidate>
          <label htmlFor={`${id}-code`} className="aw-label">
            Code
          </label>
          <div className="aw-footer-row">
            <input
              id={`${id}-code`}
              className="aw-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            <Button variant="primary" type="submit" disabled={busy || code.length < 6}>
              {busy ? "Checking…" : "Link order"}
            </Button>
          </div>
        </form>
        {error ? (
          <p id={`${id}-error`} className="aw-form-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          variant="link"
          onClick={() => {
            setClaimId(null);
            setCode("");
            setError("");
          }}
        >
          Start again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={start} className="field" noValidate>
      <label htmlFor={`${id}-order`} className="aw-label">
        Order number
      </label>
      <div className="aw-footer-row">
        <input
          id={`${id}-order`}
          className="aw-input"
          autoComplete="off"
          value={friendlyId}
          onChange={(e) => setFriendlyId(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : `${id}-help`}
        />
        <Button variant="primary" type="submit" disabled={busy || friendlyId.trim().length < 3}>
          {busy ? "Sending…" : "Send the code"}
        </Button>
      </div>
      <p id={`${id}-help`} className="field-help">
        It’s in the subject line of your order confirmation email.
      </p>
      {error ? (
        <p id={`${id}-error`} className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
