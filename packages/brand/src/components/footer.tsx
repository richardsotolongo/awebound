"use client";

import { useId, useState, type FormEvent } from "react";
import { BrandLink } from "../link";
import { Button } from "./button";
import type { NavLink } from "./header";
import { ThornCross } from "./marks";

export interface FooterProps {
  links?: NavLink[];
  tagline?: string;
  year?: number;
  /** Resolve to confirm in place; reject (or throw) to show an error. */
  onSubscribe?: (email: string) => Promise<void> | void;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The site footer: small Thorn Cross and tagline, a drop-notes sign-up and policy links. */
export function Footer({ links = [], tagline = "Royal heritage. Freedom. Resurrection.", year, onSubscribe }: FooterProps) {
  const inputId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email)) {
      setState("error");
      setMessage("Enter an email address like you@example.com.");
      return;
    }
    setState("sending");
    try {
      await onSubscribe?.(email);
      setState("done");
    } catch {
      setState("error");
      setMessage("That didn’t go through. Try again in a moment.");
    }
  }

  return (
    <footer className="aw-footer">
      <div className="aw-footer-in">
        <div className="aw-footer-brand">
          <ThornCross size="small" height={40} title="" />
          <p className="aw-small">{tagline}</p>
        </div>
        <form className="aw-footer-form" onSubmit={submit} noValidate>
          <label htmlFor={inputId} className="aw-label">
            Get drop notes
          </label>
          {state === "done" ? (
            <p className="aw-small" role="status">
              You’re on the list. Watch your inbox for the next drop.
            </p>
          ) : (
            <>
              <div className="aw-footer-row">
                <input
                  id={inputId}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="aw-input"
                  aria-invalid={state === "error"}
                  aria-describedby={state === "error" ? errorId : undefined}
                />
                <Button variant="secondary" type="submit" disabled={state === "sending"}>
                  Notify me
                </Button>
              </div>
              {state === "error" ? (
                <p id={errorId} className="aw-form-error" role="alert">
                  {message}
                </p>
              ) : null}
            </>
          )}
        </form>
        <nav className="aw-footer-nav" aria-label="Footer">
          {links.map((l) => (
            <BrandLink key={l.label} href={l.href}>
              {l.label}
            </BrandLink>
          ))}
        </nav>
      </div>
      <p className="aw-footer-legal aw-small">© {year ?? new Date().getFullYear()} Awebound</p>
    </footer>
  );
}
