"use client";

import { useId, useRef } from "react";
import { Outcome, useOwnerAction } from "@/features/archive/admin/owner-action";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { createImageUploadAction, replaceImageAction } from "@/server/catalog-admin-actions";
import type { ImageTarget } from "@/shared/pieces";

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};

/**
 * Replace one image: the file goes straight to storage, then the server stores it as WebP under a
 * new address and removes the old one.
 */
export function ImageReplace({
  target,
  label = "Replace",
}: {
  target: ImageTarget;
  label?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const { busy, message, failed, run } = useOwnerAction();

  async function choose(file: File | undefined) {
    if (!file) return;
    await run(async () => {
      const ext = EXT[file.type];
      if (!ext) return { ok: false as const, error: "Choose a WebP, PNG or JPEG image." };
      const supabase = getBrowserSupabase();
      if (!supabase) return { ok: false as const, error: "Accounts aren’t set up yet." };
      const upload = await createImageUploadAction({ target, fileName: `image.${ext}` });
      if (!upload.ok) return upload;
      const { bucket, path, token } = upload.data;
      const { error } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(path, token, file, { contentType: file.type, upsert: false });
      if (error) return { ok: false as const, error: `The upload didn’t arrive: ${error.message}` };
      return replaceImageAction({ target, path });
    }, "Replaced.");
    if (input.current) input.current.value = "";
  }

  return (
    <div className="field">
      <label htmlFor={id} className="aw-small">
        {busy ? "Uploading…" : label}
      </label>
      <input
        ref={input}
        id={id}
        className="asset-file"
        type="file"
        accept="image/webp,image/png,image/jpeg"
        disabled={busy}
        onChange={(e) => void choose(e.target.files?.[0])}
      />
      <Outcome message={message} failed={failed} />
    </div>
  );
}
