"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import {
  approveDraftAction,
  publishContentAction,
  retireContentAction,
  saveDraftAction,
} from "@/server/admin-actions";
import type { Result } from "@/server/errors";
import type { DraftFields } from "@/shared";
import { Outcome, useOwnerAction } from "./owner-action";

type Key = keyof DraftFields;

const FIELDS: { key: Key; label: string; max?: number; input?: boolean; lines?: boolean }[] = [
  { key: "publicPreview", label: "Public preview", max: 300 },
  { key: "biblicalContext", label: "Biblical context", max: 1500 },
  { key: "contextReference", label: "Context reference", max: 120, input: true },
  { key: "bibleUrl", label: "Bible URL", input: true },
  { key: "additionalBibleUrls", label: "More Bible URLs, one per line", max: 5, lines: true },
  { key: "designStory", label: "Design story", max: 3000 },
  { key: "imageryMeaning", label: "Imagery meaning", max: 2000 },
  { key: "founderNote", label: "Founder note", max: 2000 },
  { key: "shareCopy", label: "Share copy", max: 200 },
  { key: "notes", label: "Notes (owner only)", max: 1000 },
];

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * One textarea per field with a live count. The site shows only the published version, so the
 * buttons go in order: Save keeps a draft, Approve marks it ready (it needs the founder note read)
 * and Publish puts it live. Approve and Publish save any unsaved edits first, and Publish approves
 * on the way when it can, so an edit is never lost or left behind a step.
 */
export function DraftEditor({
  designKey,
  initial,
  openStatus,
  hasPublished,
}: {
  designKey: string;
  initial: DraftFields;
  openStatus: "draft" | "approved" | null;
  hasPublished: boolean;
}) {
  const id = useId();
  const [text, setText] = useState<Record<Key, string>>({
    ...initial,
    additionalBibleUrls: initial.additionalBibleUrls.join("\n"),
  });
  const [reviewed, setReviewed] = useState(false);
  const { busy, message, failed, run } = useOwnerAction();
  const fields = (): DraftFields => ({
    ...text,
    additionalBibleUrls: lines(text.additionalBibleUrls),
  });
  // Edits not yet saved: compared with what the server last gave the page.
  const dirty =
    JSON.stringify(fields()) !==
    JSON.stringify({ ...initial, additionalBibleUrls: initial.additionalBibleUrls });

  function save(e: FormEvent) {
    e.preventDefault();
    run(
      () => saveDraftAction({ designKey, fields: fields() }),
      (r) =>
        `Saved as a draft (version ${r.version}). Approve, then Publish, to put it on the site.`,
    );
  }

  /** Saves unsaved edits first, then approves. */
  async function saveAndApprove(): Promise<Result<null>> {
    if (dirty) {
      const saved = await saveDraftAction({ designKey, fields: fields() });
      if (!saved.ok) return saved;
    }
    return approveDraftAction({ designKey, founderNoteReviewed: true });
  }

  /** Saves and approves when needed, then publishes. */
  async function publish(): Promise<Result<unknown>> {
    if (dirty || openStatus !== "approved") {
      const approved = await saveAndApprove();
      if (!approved.ok) return approved;
    }
    return publishContentAction({ designKeys: [designKey] });
  }
  const canPublish = !busy && (reviewed || (openStatus === "approved" && !dirty));

  return (
    <form onSubmit={save} className="admin-editor" noValidate>
      {FIELDS.map((f) => {
        const value = text[f.key];
        const used = f.lines ? lines(value).length : value.length;
        const over = f.max !== undefined && used > f.max;
        const set = (v: string) => setText((t) => ({ ...t, [f.key]: v }));
        return (
          <div key={f.key} className="field">
            <label htmlFor={`${id}-${f.key}`} className="aw-label">
              {f.label}
            </label>
            {f.input ? (
              <input
                id={`${id}-${f.key}`}
                className="aw-input"
                value={value}
                onChange={(e) => set(e.target.value)}
                aria-invalid={over || undefined}
              />
            ) : (
              <textarea
                id={`${id}-${f.key}`}
                className="aw-textarea"
                rows={f.lines ? 3 : 6}
                value={value}
                onChange={(e) => set(e.target.value)}
                aria-invalid={over || undefined}
              />
            )}
            {f.max !== undefined ? (
              <p className={over ? "aw-form-error" : "field-help"}>
                {used}/{f.max}
                {f.lines ? " links" : ""}
              </p>
            ) : null}
          </div>
        );
      })}
      <label htmlFor={`${id}-reviewed`} className="admin-check">
        <input
          id={`${id}-reviewed`}
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
        />
        <span>I’ve reviewed the founder note and it is my own wording</span>
      </label>
      <p className="field-help">
        The site shows only the published version. Save keeps a draft, Approve marks it ready and
        Publish puts it live
        {openStatus === "approved" && !dirty
          ? ": this version is approved and waiting to be published."
          : dirty
            ? ": you have unsaved changes."
            : "."}
      </p>
      <div className="account-actions">
        <Button variant="secondary" type="submit" disabled={busy}>
          {busy ? "Working…" : "Save draft"}
        </Button>
        <Button
          variant="secondary"
          disabled={busy || !reviewed}
          onClick={() =>
            run(
              saveAndApprove,
              dirty
                ? "Saved and approved. Publish to put it on the site."
                : "Approved. Publish to put it on the site.",
            )
          }
        >
          Approve
        </Button>
        <Button
          disabled={!canPublish}
          onClick={() => run(publish, "Published. It’s on the site now.")}
        >
          Publish
        </Button>
        {hasPublished ? (
          <Button
            variant="link"
            disabled={busy}
            onClick={() => run(() => retireContentAction({ designKey }), "Retired.")}
          >
            Retire the published version
          </Button>
        ) : null}
      </div>
      <Outcome message={message} failed={failed} />
    </form>
  );
}
