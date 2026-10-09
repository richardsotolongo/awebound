"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { GoogleMark } from "@/components/icons";
import { getBrowserSupabase } from "@/lib/supabase/browser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Passwordless sign-in: Google, or a one-time link and code sent by email (Supabase Auth + Resend SMTP). */
export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const id = useId();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function google() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback() },
    });
    if (err) {
      setBusy(false);
      setError("Google sign-in didn’t start. Try again, or use your email.");
    }
  }

  async function sendLink(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email)) {
      setError("Enter an email address like you@example.com.");
      return;
    }
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback(), shouldCreateUser: true },
    });
    setBusy(false);
    if (err) {
      setError(
        err.status === 429
          ? "Too many requests. Wait a minute and try again."
          : "We couldn’t send the email. Check the address and try again.",
      );
      return;
    }
    setStep("code");
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (err) {
      setError("That code didn’t work. Check it, or send a new one.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (step === "code") {
    return (
      <div style={{ display: "grid", gap: "var(--space-6)" }}>
        <div className="notice" role="status">
          <p className="aw-small" style={{ color: "var(--ink)" }}>
            We sent a sign-in link and a 6-digit code to <strong>{email}</strong>. Open the link on
            this device, or enter the code here.
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
              Sign in
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
            setStep("email");
            setCode("");
            setError("");
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-8)" }}>
      <Button variant="secondary" block onClick={google} disabled={busy}>
        <GoogleMark /> Continue with Google
      </Button>

      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}
        aria-hidden="true"
      >
        <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span className="aw-label">or</span>
        <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>

      <form onSubmit={sendLink} className="field" noValidate>
        <label htmlFor={`${id}-email`} className="aw-label">
          Email
        </label>
        <input
          id={`${id}-email`}
          className="aw-input"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : `${id}-help`}
        />
        <p id={`${id}-help`} className="field-help">
          We’ll email you a sign-in link and a code. No password needed.
        </p>
        <Button variant="primary" type="submit" block disabled={busy}>
          {busy ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>
      {error ? (
        <p id={`${id}-error`} className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
