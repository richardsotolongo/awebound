"use client";

import { Button, SizeSelector } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { Sheet } from "@/components/sheet";
import { SizeGuide } from "@/features/product/size-guide";
import type { FitGuide, FitPreference } from "@/shared";
import { clearFitPreferenceAction, saveFitPreferenceAction } from "@/server/archive-actions";

/** One garment style: pick the size you usually wear (caps keep a note), with the shop's size guide at hand. */
export function FitForm({ guide, initial }: { guide: FitGuide; initial: FitPreference | null }) {
  const id = useId();
  const [size, setSize] = useState<string | undefined>(initial?.size ?? undefined);
  const [note, setNote] = useState(initial?.note ?? "");
  const [saved, setSaved] = useState<FitPreference | null>(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const dirty = (size ?? null) !== (saved?.size ?? null) || note.trim() !== (saved?.note ?? "");

  async function save(e: FormEvent) {
    e.preventDefault();
    setState("saving");
    const result = await saveFitPreferenceAction({
      guideId: guide.id,
      size: guide.isCap ? null : (size ?? null),
      note: note.trim() || null,
    }).catch(() => null);
    if (result?.ok) {
      setSaved(result.data);
      setState("saved");
    } else {
      setState("error");
      setError(result?.error ?? "That didn’t save. Try again.");
    }
  }

  async function clear() {
    setState("saving");
    const result = await clearFitPreferenceAction({ guideId: guide.id }).catch(() => null);
    if (result?.ok) {
      setSaved(null);
      setSize(undefined);
      setNote("");
      setState("idle");
    } else {
      setState("error");
      setError(result?.error ?? "That didn’t work. Try again.");
    }
  }

  return (
    <form onSubmit={save} className="field" noValidate>
      {guide.isCap ? (
        <>
          <label htmlFor={`${id}-note`} className="aw-label">
            Fit note (optional)
          </label>
          <input
            id={`${id}-note`}
            className="aw-input"
            maxLength={80}
            placeholder="Worn low, strap loosened"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setState("idle");
            }}
          />
        </>
      ) : (
        <>
          <div className="buy-option-head">
            <span className="aw-label">Size</span>
            <Button variant="link" onClick={() => setGuideOpen(true)} aria-haspopup="dialog">
              Size guide
            </Button>
          </div>
          <SizeSelector
            sizes={guide.sizes}
            value={size}
            onChange={(s) => {
              setSize(s);
              setState("idle");
            }}
          />
          <label htmlFor={`${id}-note`} className="aw-label">
            Note (optional)
          </label>
          <input
            id={`${id}-note`}
            className="aw-input"
            maxLength={80}
            placeholder="Size up for layering"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setState("idle");
            }}
          />
        </>
      )}
      <p className="field-help">
        A saved size is a reminder for you, not a guarantee of fit. Check the size guide before you order.
      </p>
      <div className="account-actions">
        <Button variant="secondary" type="submit" disabled={state === "saving" || !dirty || (!guide.isCap && !size)}>
          {state === "saving" ? "Saving…" : "Save"}
        </Button>
        {saved ? (
          <Button variant="link" onClick={clear} disabled={state === "saving"}>
            Clear
          </Button>
        ) : null}
      </div>
      <p className="field-help" role="status" aria-live="polite">
        {state === "saved" ? "Saved." : state === "error" ? error : ""}
      </p>
      <Sheet
        id={`${id}-guide`}
        size={guide.guide.image ? "wide" : undefined}
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title={`${guide.name} size guide`}
      >
        <SizeGuide guide={guide.guide} cut={guide.name} />
      </Sheet>
    </form>
  );
}
