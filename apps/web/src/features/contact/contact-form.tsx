"use client";

import { Button } from "@awebound/brand";
import { CONTACT_TOPIC_LABELS, CONTACT_TOPICS, type ContactTopic } from "@/shared";
import { useId, useState, type FormEvent } from "react";
import { sendContact } from "@/server/actions";

type Fields = Partial<Record<"name" | "email" | "topic" | "message", string>>;

export function ContactForm() {
  const id = useId();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<Fields>({});
  const [formError, setFormError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setState("sending");
    setFieldErrors({});
    setFormError("");
    const result = await sendContact({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      topic: String(data.get("topic") ?? "other") as ContactTopic,
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""),
    }).catch(() => null);
    if (result?.ok) {
      setState("done");
    } else {
      setState("error");
      setFieldErrors(result?.fields ?? {});
      setFormError(result?.error ?? "That didn’t go through. Try again, or email us directly.");
    }
  }

  if (state === "done") {
    return (
      <div className="notice" role="status">
        <p className="aw-h3">Thank you</p>
        <p className="aw-body">
          Your message is on its way. We reply within 72 hours, and we’ve sent you a copy.
        </p>
      </div>
    );
  }

  const err = (name: keyof Fields) =>
    fieldErrors[name] ? (
      <p id={`${id}-${name}-error`} className="aw-form-error">
        {fieldErrors[name]}
      </p>
    ) : null;
  const describedBy = (name: keyof Fields) =>
    fieldErrors[name] ? `${id}-${name}-error` : undefined;

  return (
    <form onSubmit={submit} noValidate style={{ display: "grid", gap: "var(--space-6)" }}>
      <div
        style={{
          display: "grid",
          gap: "var(--space-6)",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        <div className="field">
          <label htmlFor={`${id}-name`} className="aw-label">
            Name
          </label>
          <input
            id={`${id}-name`}
            name="name"
            className="aw-input"
            autoComplete="name"
            required
            maxLength={120}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={describedBy("name")}
          />
          {err("name")}
        </div>
        <div className="field">
          <label htmlFor={`${id}-email`} className="aw-label">
            Email
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            className="aw-input"
            autoComplete="email"
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={describedBy("email")}
          />
          {err("email")}
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${id}-topic`} className="aw-label">
          What is it about?
        </label>
        <select id={`${id}-topic`} name="topic" className="aw-select" defaultValue="order">
          {CONTACT_TOPICS.map((t) => (
            <option key={t} value={t}>
              {CONTACT_TOPIC_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={`${id}-message`} className="aw-label">
          Message
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          className="aw-textarea"
          required
          maxLength={4000}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={describedBy("message")}
        />
        {err("message")}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden="true" className="visually-hidden">
        <label htmlFor={`${id}-website`}>Leave this empty</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div style={{ display: "grid", gap: "var(--space-3)", justifyItems: "start" }}>
        <Button variant="primary" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send message"}
        </Button>
        {formError ? (
          <p className="aw-form-error" role="alert">
            {formError}
          </p>
        ) : null}
      </div>
    </form>
  );
}
