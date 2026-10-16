"use client";

import { Button } from "@awebound/brand";
import { useId, useState } from "react";
import { reviewIdeaAction } from "@/server/admin-actions";
import { IDEA_STATUS_LABELS, IDEA_STATUSES, type IdeaStatus } from "@/shared";
import { Outcome, useOwnerAction } from "./owner-action";

/** The owner's review of one submission: its status and a private note (the sender never sees it). */
export function IdeaReview({
  id,
  status,
  note,
}: {
  id: string;
  status: IdeaStatus;
  note: string | null;
}) {
  const uid = useId();
  const [next, setNext] = useState<IdeaStatus>(status);
  const [text, setText] = useState(note ?? "");
  const { busy, message, failed, run } = useOwnerAction();
  const changed = next !== status || text !== (note ?? "");

  return (
    <form
      className="admin-idea-review"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => reviewIdeaAction({ id, status: next, note: text }), "Saved.");
      }}
    >
      <div className="field">
        <label htmlFor={`${uid}-status`} className="aw-label">
          Status
        </label>
        <select
          id={`${uid}-status`}
          className="aw-select"
          value={next}
          onChange={(e) => setNext(e.target.value as IdeaStatus)}
        >
          {IDEA_STATUSES.map((s) => (
            <option key={s} value={s}>
              {IDEA_STATUS_LABELS[s].owner}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${uid}-note`} className="aw-label">
          Private note
        </label>
        <textarea
          id={`${uid}-note`}
          className="aw-textarea admin-idea-note"
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="admin-idea-save">
        <Button variant="secondary" type="submit" disabled={busy || !changed}>
          {busy ? "Saving…" : "Save"}
        </Button>
        <Outcome message={message} failed={failed} />
      </div>
    </form>
  );
}
