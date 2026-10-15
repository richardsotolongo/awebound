"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type DragEvent, type FormEvent } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { createAssetUploadAction, registerAssetAction } from "@/server/admin-actions";
import type { AssetFormat } from "@/shared";

const TITLES: Record<AssetFormat, string> = {
  phone: "Phone wallpaper",
  desktop: "Desktop wallpaper",
};

/** The storage bucket's limit (supabase/migrations: archive-assets). */
const MAX_BYTES = 50 * 1024 * 1024;

interface Ready {
  blob: Blob;
  type: "image/png" | "image/jpeg";
  name: string;
  width: number;
  height: number;
  /** The file's own format when it was converted to PNG in the browser. */
  convertedFrom: string | null;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** PNG or JPEG by the file's first bytes, whatever its name or reported type says. */
async function sniff(file: Blob): Promise<"image/png" | "image/jpeg" | null> {
  const b = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((v, i) => b[i] === v)) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
}

/** Decodes any image the browser can read (an <img> reads more formats than createImageBitmap in Safari). */
function decode(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unreadable"));
    img.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

/**
 * Gets a chosen file ready for the bucket, which takes PNG and JPEG only: those go as they are;
 * anything else the browser can open (WebP, HEIC in Safari, AVIF, GIF) is redrawn as a PNG.
 */
async function prepare(file: File): Promise<Ready> {
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-") || "wallpaper";
  const type = await sniff(file);
  const img = await decode(file).catch(() => null);
  if (type) {
    return {
      blob: file,
      type,
      name: `${base}.${type === "image/png" ? "png" : "jpg"}`,
      width: img?.naturalWidth ?? 0,
      height: img?.naturalHeight ?? 0,
      convertedFrom: null,
    };
  }
  const from = (file.type.split("/")[1] || file.name.split(".").pop() || "image").toUpperCase();
  if (!img) {
    throw new Error(
      `This browser can’t open ${from} files. Export the wallpaper as a PNG and choose it again.`,
    );
  }
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")?.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("That image couldn’t be converted. Export it as a PNG and try again.");
  return {
    blob,
    type: "image/png",
    name: `${base}.png`,
    width: img.naturalWidth,
    height: img.naturalHeight,
    convertedFrom: from,
  };
}

/**
 * Choose or drop a wallpaper, then Upload: the file goes straight to Storage with a one-time
 * signed URL and is registered from its real bytes. Every image file can be chosen (a picker
 * limited to PNG and JPEG greys out the rest); one that isn't PNG or JPEG is converted first.
 */
export function AssetUploader({ designs }: { designs: { key: string; name: string }[] }) {
  const id = useId();
  const router = useRouter();
  const [designKey, setDesignKey] = useState("");
  const [format, setFormat] = useState<AssetFormat>("phone");
  const [title, setTitle] = useState(TITLES.phone);
  const [ready, setReady] = useState<Ready | null>(null);
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
      const next = await prepare(file);
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
              {ready.convertedFrom ? ` (converted from ${ready.convertedFrom} to PNG)` : ""}
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
