"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { setHonoraryAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

/**
 * Grant or remove an honorary Founding seal by the person's account email, with a reason for the
 * audit log. They need a free account first.
 */
export function HonoraryTools() {
  const id = useId();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [action, setAction] = useState<"grant" | "remove">("grant");
  const [reason, setReason] = useState("");
  const tool = useOwnerAction();

  function submit(e: FormEvent) {
    e.preventDefault();
    tool.run(
      () => setHonoraryAction({ email: email.trim(), action, reason }),
      (r) => {
        setEmail("");
        setReason("");
        router.refresh();
        return action === "grant"
          ? `Honorary seal granted to ${r.email}.`
          : `Honorary seal removed from ${r.email}.`;
      },
    );
  }

  return (
    <form onSubmit={submit} className="admin-editor field" noValidate>
      <label htmlFor={`${id}-email`} className="aw-label">
        Their account email
      </label>
      <input
        id={`${id}-email`}
        className="aw-input"
        type="email"
        autoComplete="off"
        maxLength={254}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor={`${id}-action`} className="aw-label">
        Action
      </label>
      <select
        id={`${id}-action`}
        className="aw-select"
        value={action}
        onChange={(e) => setAction(e.target.value === "remove" ? "remove" : "grant")}
      >
        <option value="grant">Grant an honorary seal</option>
        <option value="remove">Remove an honorary seal</option>
      </select>
      <label htmlFor={`${id}-reason`} className="aw-label">
        Reason (only you see it)
      </label>
      <input
        id={`${id}-reason`}
        className="aw-input"
        maxLength={300}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <p className="field-help">
        They need a free account with this email first. An honorary seal opens everything the
        Founding seal does, with “Honorary” in place of a number.
      </p>
      <div>
        <Button
          variant="secondary"
          type="submit"
          disabled={tool.busy || !email.includes("@") || reason.trim().length < 3}
        >
          {action === "grant" ? "Grant" : "Remove"}
        </Button>
      </div>
      <Outcome message={tool.message} failed={tool.failed} />
    </form>
  );
}
