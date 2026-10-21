"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { sendFoundingNoteAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

/**
 * Richard's note to Founding and honorary members before a release. "Send a test to me" goes
 * only to the owner; "Send to all" goes to every active Founding Member and every honorary member
 * who hasn't turned release emails off.
 */
export function FoundingNote({ founding, honorary }: { founding: number; honorary: number }) {
  const members = founding + honorary;
  const id = useId();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const note = useOwnerAction();
  const ready = subject.trim().length >= 3 && body.trim().length >= 10;

  function send(test: boolean) {
    setConfirming(false);
    note.run(
      () => sendFoundingNoteAction({ subject, body, test }),
      (r) =>
        test
          ? "Test sent to your email."
          : `Sent to ${r.queued} ${r.queued === 1 ? "member" : "members"}.`,
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    send(true);
  }

  return (
    <form onSubmit={submit} className="admin-editor field" noValidate>
      <label htmlFor={`${id}-subject`} className="aw-label">
        Subject
      </label>
      <input
        id={`${id}-subject`}
        className="aw-input"
        maxLength={150}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <label htmlFor={`${id}-body`} className="aw-label">
        Your note
      </label>
      <textarea
        id={`${id}-body`}
        className="aw-textarea"
        maxLength={5000}
        rows={8}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <p className="field-help">
        It opens with “To our Founding Members” and ends with a button to their Founding tab.
        Members who turned release emails off in Settings are skipped.
      </p>
      <p className="field-help">
        Goes to {founding} {founding === 1 ? "Founding Member" : "Founding Members"} and {honorary}{" "}
        {honorary === 1 ? "honorary member" : "honorary members"}.
      </p>
      <div className="admin-actions-row">
        <Button variant="secondary" type="submit" disabled={note.busy || !ready}>
          Send a test to me
        </Button>
        {confirming ? (
          <>
            <Button
              variant="primary"
              type="button"
              disabled={note.busy}
              onClick={() => send(false)}
            >
              Yes, send to {members} {members === 1 ? "member" : "members"}
            </Button>
            <Button variant="link" type="button" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            type="button"
            disabled={note.busy || !ready || members === 0}
            onClick={() => setConfirming(true)}
          >
            Send to all members
          </Button>
        )}
      </div>
      <Outcome message={note.message} failed={note.failed} />
    </form>
  );
}
