"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type DragEvent, type FormEvent } from "react";
import { mb, prepareImage, type PreparedImage } from "@/lib/prepare-image";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { createAssetUploadAction, registerAssetAction } from "@/server/admin-actions";
import type { AssetFormat } from "@/shared";

const TITLES: Record<AssetFormat, string> = {
  phone: "Phone wallpaper",
  desktop: "Desktop wallpaper",
};

/** The storage bucket's limit (supabase/migrations: archive-assets). */
const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Choose or drop a wallpaper, then Upload: the file goes straight to Storage with a one-time
 * signed URL and is registered from its real bytes. Every image file can be chosen (a picker
 * limited to PNG and JPEG greys out the rest); one that isn't PNG or JPEG is converted first.
 */
export function AssetUploader({ designs }: { designs: { key: string; name: string }[] }) {
  const id = useId();
  const router = useRouter();
  // A piece's own review page offers only that design: it is chosen already.
  const [designKey, setDesignKey] = useState(designs.length === 1 ? designs[0]!.key : "");
  const [format, setFormat] = useState<AssetFormat>("phone");
  const [title, setTitle] = useState(TITLES.phone);
  const [ready, setReady] = useState<PreparedImage | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function changeFormat(next: AssetFormat) {
    if (title === TITLES[format]) setTitle(TITLES[next]);
    setFormat(next);
  }

  async function choose(file: File | null | undefined) {
    setMessage("");
    setError("");
    setReady(null);
    setPreview(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(`That file is ${mb(file.size)}. The limit is 50 MB, so export a smaller PNG.`);
      return;
    }
    setBusy(true);
    try {
      const next = await prepareImage(file, { fallbackName: "wallpaper", maxBytes: MAX_BYTES });
      if (next.blob.size > MAX_BYTES)
        throw new Error("Converted, it is over 50 MB. Export a smaller PNG.");
      setReady(next);
      setPreview(URL.createObjectURL(next.blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file couldn’t be read.");
    } finally {
      setBusy(false);
    }
  }

  function drop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    void choose(e.dataTransfer.files[0]);
  }

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!ready) {
      setError("Choose a file first.");
      return;
    }
    setBusy(true);
    setMessage("");
    setError("");
    const fail = (text: string) => {
      setError(text);
      setBusy(false);
    };
    const supabase = getBrowserSupabase();
    if (!supabase) return fail("Accounts aren’t set up yet.");
    const key = designKey || null;
    const target = await createAssetUploadAction({
      designKey: key,
      format,
      fileName: ready.name,
    }).catch(() => null);
    if (!target?.ok) return fail(target?.error ?? "That didn’t work. Try again in a moment.");
    const { bucket, path, token } = target.data;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, ready.blob, { contentType: ready.type, upsert: false });
    if (uploadError) return fail(`The upload didn’t arrive: ${uploadError.message}`);
    const registered = await registerAssetAction({
      designKey: key,
      format,
      path,
      title: title.trim() || TITLES[format],
    }).catch(() => null);
    if (!registered?.ok)
      return fail(registered?.error ?? "The file is in storage but wasn’t recorded. Try again.");
    const { width, height, mime } = registered.data;
    setMessage(
      `Uploaded: ${width} x ${height}, ${mime}. It’s listed below under “Uploaded, not published”. Publish it there to put it in owners’ collections.`,
    );
    setReady(null);
    setPreview(null);
    setRound((r) => r + 1);
    setBusy(false);
    router.refresh();
  }

  const sideways =
    ready && ready.width && ready.height
      ? format === "phone" && ready.width > ready.height
        ? "This is wider than tall. Check that it’s the phone file, or switch the format to Desktop."
        : format === "desktop" && ready.height > ready.width
          ? "This is taller than wide. Check that it’s the desktop file, or switch the format to Phone."
          : null
      : null;

  return (
    <form onSubmit={upload} className="admin-editor" noValidate>
      <div className="field">
        <label htmlFor={`${id}-design`} className="aw-label">
          Design
        </label>
        <select
          id={`${id}-design`}
          className="aw-select"
          value={designKey}
          onChange={(e) => setDesignKey(e.target.value)}
        >
          <option value="">Unassigned</option>
          {designs.map((d) => (
            <option key={d.key} value={d.key}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-format`} className="aw-label">
          Format
        </label>
        <select
          id={`${id}-format`}
          className="aw-select"
          value={format}
          onChange={(e) => changeFormat(e.target.value === "desktop" ? "desktop" : "phone")}
        >
          <option value="phone">Phone</option>
          <option value="desktop">Desktop</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-title`} className="aw-label">
          Title
        </label>
        <input
          id={`${id}-title`}
          className="aw-input"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-file`} className="aw-label">
          File
        </label>
        <div
          className="asset-drop"
          data-over={over || undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
        >
          <input
            key={round}
            id={`${id}-file`}
            className="asset-file"
            type="file"
            accept="image/*"
            onChange={(e) => void choose(e.target.files?.[0])}
          />
          <p className="field-help">Or drop the file here.</p>
        </div>
        {ready && preview ? (
          <div className="asset-chosen">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the chosen file */}
            <img src={preview} alt="" />
            <p className="aw-small">
              {ready.name}
              {ready.width ? `, ${ready.width} x ${ready.height}` : ""}, {mb(ready.blob.size)}
              {ready.convertedFrom
                ? ` (converted from ${ready.convertedFrom} to ${ready.type === "image/png" ? "PNG" : "JPEG"})`
                : ""}
            </p>
          </div>
        ) : null}
        {sideways ? <p className="field-help">{sideways}</p> : null}
        <p className="field-help">
          Upload the PNG master. A JPEG is accepted and recorded as a JPEG, so owners can see it is
          not the master. Other image files, such as WebP or HEIC, are converted to PNG here first.
        </p>
      </div>
      <div>
        <Button variant="secondary" type="submit" disabled={busy}>
          {busy ? "Working…" : "Upload"}
        </Button>
      </div>
      <p className="field-help" role="status" aria-live="polite">
        {message}
      </p>
      {error ? (
        <p className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
