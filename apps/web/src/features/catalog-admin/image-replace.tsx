"use client";

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
 * A Replace button for one image: the file goes straight to storage, then the server stores it as
 * WebP under a new address and removes the old one.
 */
export function ImageReplace({
  target,
  label = "Replace",
}: {
  target: ImageTarget;
  label?: string;
}) {
  const { busy, message, failed, run } = useOwnerAction();

  async function choose(input: HTMLInputElement) {
    const file = input.files?.[0];
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
    input.value = "";
  }

  return (
    <div className="review-replace">
      <label className="aw-btn aw-btn-secondary" aria-disabled={busy || undefined}>
        {busy ? "Uploading…" : label}
        <input
          className="visually-hidden"
          type="file"
          accept="image/webp,image/png,image/jpeg"
          disabled={busy}
          onChange={(e) => void choose(e.currentTarget)}
        />
      </label>
      <Outcome message={message} failed={failed} />
    </div>
  );
}
