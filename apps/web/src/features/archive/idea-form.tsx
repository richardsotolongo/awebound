"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { mb, prepareImage, type PreparedImage } from "@/lib/prepare-image";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { startIdeaUploadAction, submitIdeaAction } from "@/server/archive-actions";
import { IDEA_MAX_BYTES } from "@/shared";

type Field = "image" | "idea" | "verse" | "context" | "rights";

/**
 * An Idea Submission: an image, the idea, the verse and its biblical context, any of them. The
 * image goes straight to private storage with a one-time signed URL; the server checks the
 * purchases and the submissions left again before it records anything.
 */
export function IdeaForm({ email, owner }: { email: string; owner: boolean }) {
  const id = useId();
  const router = useRouter();
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [state, setState] = useState<"idle" | "reading" | "sending">("idle");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState("");

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function choose(file: File | null | undefined) {
    setFieldErrors((f) => ({ ...f, image: undefined }));
    setImage(null);
    setPreview(null);
    if (!file) return;
    if (file.size > IDEA_MAX_BYTES * 3) {
      setFieldErrors({ image: `That file is ${mb(file.size)}. Send an image up to 10 MB.` });
      return;
    }
    setState("reading");
    try {
      const next = await prepareImage(file, { fallbackName: "idea", maxBytes: IDEA_MAX_BYTES });
      if (next.blob.size > IDEA_MAX_BYTES)
        throw new Error(`That image is ${mb(next.blob.size)}. Send one up to 10 MB.`);
      setImage(next);
      setPreview(URL.createObjectURL(next.blob));
    } catch (e) {
      setFieldErrors({ image: e instanceof Error ? e.message : "That file couldn’t be read." });
    } finally {
      setState("idle");
    }
  }

  function clearImage() {
    setImage(null);
    setPreview(null);
    setRound((r) => r + 1);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const fields = { idea: text("idea"), verse: text("verse"), context: text("context") };
    setFieldErrors({});
    setFormError("");
    if (!image && !fields.idea && !fields.verse && !fields.context) {
      setFieldErrors({ idea: "Add an image or a few words about your idea." });
      return;
    }
    if (data.get("rights") !== "on") {
      setFieldErrors({ rights: "Confirm the design is yours to share." });
      return;
    }
    setState("sending");
    const fail = (message: string, f: Partial<Record<Field, string>> = {}) => {
      setFieldErrors(f);
      setFormError(message);
      setState("idle");
    };

    let imagePath: string | null = null;
    if (image) {
      const supabase = getBrowserSupabase();
      if (!supabase) return fail("Accounts aren’t set up yet.");
      const target = await startIdeaUploadAction({ fileName: image.name }).catch(() => null);
      if (!target?.ok) return fail(target?.error ?? "That didn’t work. Try again in a moment.");
      const { bucket, path, token } = target.data;
      const { error } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, image.blob, { contentType: image.type, upsert: false });
      if (error) return fail("Your image didn’t upload. Check your connection and try again.");
      imagePath = path;
    }

    const result = await submitIdeaAction({
      ...fields,
      imagePath,
      rights: true,
      website: text("website"),
    }).catch(() => null);
    if (!result?.ok) {
      return fail(
        result?.error ?? "That didn’t go through. Try again in a moment.",
        (result?.fields ?? {}) as Partial<Record<Field, string>>,
      );
    }
    track("idea_submitted", { image: Boolean(image) });
    // The page thanks them at the top (?sent=1) and lists the idea; the form starts over.
    form.reset();
    clearImage();
    setState("idle");
    router.replace("/account/ideas?sent=1");
    router.refresh();
  }

  const err = (name: Field) =>
    fieldErrors[name] ? (
      <p id={`${id}-${name}-error`} className="aw-form-error">
        {fieldErrors[name]}
      </p>
    ) : null;
  const describedBy = (name: Field, help = true) =>
    [help ? `${id}-${name}-help` : null, fieldErrors[name] ? `${id}-${name}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const busy = state !== "idle";

  return (
    <form onSubmit={submit} noValidate className="idea-form">
      <p className="aw-body">
        Share as much or as little as you like. The more you give us, the easier it is to see what
        you have in mind.
      </p>
      {owner ? (
        <p className="notice aw-small">
          You’re seeing this as the owner. Customers need 5 purchases first; your test ideas land in
          Owner → Ideas and aren’t counted.
        </p>
      ) : null}

      <div className="field">
        <label htmlFor={`${id}-image`} className="aw-label">
          Your design
        </label>
        <input
          key={round}
          id={`${id}-image`}
          className="asset-file"
          type="file"
          accept="image/png,image/jpeg,image/*"
          aria-describedby={describedBy("image")}
          aria-invalid={Boolean(fieldErrors.image)}
          onChange={(e) => void choose(e.target.files?.[0])}
        />
        <p id={`${id}-image-help`} className="field-help">
          A sketch, a drawing or a mockup. PNG or JPEG up to 10 MB.
        </p>
        {image && preview ? (
          <div className="asset-chosen idea-chosen">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the chosen file */}
            <img src={preview} alt="Your chosen design" />
            <p className="aw-small">
              {image.name}, {mb(image.blob.size)}
              {image.convertedFrom
                ? ` (converted from ${image.convertedFrom} to ${image.type === "image/png" ? "PNG" : "JPEG"})`
                : ""}
            </p>
            <Button variant="link" type="button" onClick={clearImage}>
              Remove image
            </Button>
          </div>
        ) : null}
        {err("image")}
      </div>

      <div className="field">
        <label htmlFor={`${id}-idea`} className="aw-label">
          Your idea
        </label>
        <textarea
          id={`${id}-idea`}
          name="idea"
          className="aw-textarea"
          maxLength={4000}
          aria-describedby={describedBy("idea")}
          aria-invalid={Boolean(fieldErrors.idea)}
        />
        <p id={`${id}-idea-help`} className="field-help">
          What do you picture? The image, the lettering, the garment and where the print sits.
        </p>
        {err("idea")}
      </div>

      <div className="field">
        <label htmlFor={`${id}-verse`} className="aw-label">
          The verse it represents
        </label>
        <input
          id={`${id}-verse`}
          name="verse"
          className="aw-input"
          maxLength={300}
          placeholder="Psalm 23:4"
          aria-describedby={describedBy("verse")}
          aria-invalid={Boolean(fieldErrors.verse)}
        />
        <p id={`${id}-verse-help`} className="field-help">
          The reference, and the words too if you like.
        </p>
        {err("verse")}
      </div>

      <div className="field">
        <label htmlFor={`${id}-context`} className="aw-label">
          The biblical context
        </label>
        <textarea
          id={`${id}-context`}
          name="context"
          className="aw-textarea"
          maxLength={4000}
          aria-describedby={describedBy("context")}
          aria-invalid={Boolean(fieldErrors.context)}
        />
        <p id={`${id}-context-help`} className="field-help">
          What happens in the passage, and what it means to you.
        </p>
        {err("context")}
      </div>

      <div className="field">
        <label className="idea-check">
          <input
            type="checkbox"
            name="rights"
            onChange={() => setFieldErrors((f) => ({ ...f, rights: undefined }))}
            aria-describedby={describedBy("rights", false)}
            aria-invalid={Boolean(fieldErrors.rights)}
          />
          <span>This design is my own work, or I have the right to share it.</span>
        </label>
        {err("rights")}
        <p className="field-help">
          Sending an idea doesn’t commit Awebound to making it. If we choose yours, we’ll write to
          you at {email} before anything is made, and your piece is free.
        </p>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden="true" className="visually-hidden">
        <label htmlFor={`${id}-website`}>Leave this empty</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="idea-form-foot">
        <Button variant="primary" type="submit" disabled={busy}>
          {state === "sending"
            ? "Sending…"
            : state === "reading"
              ? "Reading image…"
              : "Send my idea"}
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
