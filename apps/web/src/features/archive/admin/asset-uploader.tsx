"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { createAssetUploadAction, registerAssetAction } from "@/server/admin-actions";
import type { AssetFormat } from "@/shared";

const TITLES: Record<AssetFormat, string> = { phone: "Phone wallpaper", desktop: "Desktop wallpaper" };

/** Sends the file straight to Storage with a one-time signed URL, then registers it from its real bytes. */
export function AssetUploader({ designs }: { designs: { key: string; name: string }[] }) {
  const id = useId();
  const router = useRouter();
  const [designKey, setDesignKey] = useState("");
  const [format, setFormat] = useState<AssetFormat>("phone");
  const [title, setTitle] = useState(TITLES.phone);
  const [file, setFile] = useState<File | null>(null);
  const [round, setRound] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function changeFormat(next: AssetFormat) {
    if (title === TITLES[format]) setTitle(TITLES[next]);
    setFormat(next);
  }

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
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
    const fileName = file.name.replace(/[^\w.-]+/g, "-");
    const target = await createAssetUploadAction({ designKey: key, format, fileName }).catch(() => null);
    if (!target?.ok) return fail(target?.error ?? "That didn’t work. Try again in a moment.");
    const { bucket, path, token } = target.data;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, file, { contentType: file.type, upsert: false });
    if (uploadError) return fail(`The upload didn’t arrive: ${uploadError.message}`);
    const registered = await registerAssetAction({ designKey: key, format, path, title: title.trim() || TITLES[format] }).catch(() => null);
    if (!registered?.ok) return fail(registered?.error ?? "The file is in storage but wasn’t recorded. Try again.");
    const { width, height, mime } = registered.data;
    setMessage(`Registered: ${width} x ${height}, ${mime}.`);
    setFile(null);
    setRound((r) => r + 1);
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={upload} className="admin-editor" noValidate>
      <div className="field">
        <label htmlFor={`${id}-design`} className="aw-label">
          Design
        </label>
        <select id={`${id}-design`} className="aw-select" value={designKey} onChange={(e) => setDesignKey(e.target.value)}>
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
        <select id={`${id}-format`} className="aw-select" value={format} onChange={(e) => changeFormat(e.target.value === "desktop" ? "desktop" : "phone")}>
          <option value="phone">Phone</option>
          <option value="desktop">Desktop</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-title`} className="aw-label">
          Title
        </label>
        <input id={`${id}-title`} className="aw-input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-file`} className="aw-label">
          File
        </label>
        <input key={round} id={`${id}-file`} type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <p className="field-help">
          Upload the PNG master. A JPEG is accepted and recorded as a JPEG, so owners can see it is not the master.
        </p>
      </div>
      <div>
        <Button variant="secondary" type="submit" disabled={busy || !file}>
          {busy ? "Uploading…" : "Upload"}
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
