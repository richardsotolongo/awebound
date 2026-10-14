"use client";

import { Button } from "@awebound/brand";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSignedIn } from "@/lib/supabase/browser";
import { getSavedSlugsAction, savePieceAction, unsavePieceAction } from "@/server/archive-actions";

/** Save or remove a piece from My Archive. Product pages are cached, so the state loads after mount. */
export function SavePieceButton({ slug }: { slug: string }) {
  const signedIn = useSignedIn();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    getSavedSlugsAction()
      .then((r) => {
        if (live && r.ok) setSaved(r.data.includes(slug));
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [signedIn, slug]);

  if (!signedIn) {
    return (
      <p className="aw-small">
        <Link href={`/sign-in?next=${encodeURIComponent(`/shop/${slug}`)}`}>Save this piece</Link>{" "}
        to your Archive.
      </p>
    );
  }

  async function toggle() {
    setBusy(true);
    setError("");
    const action = saved ? unsavePieceAction : savePieceAction;
    const result = await action({ slug }).catch(() => null);
    setBusy(false);
    if (result?.ok) setSaved(result.data.saved);
    else setError(result?.error ?? "That didn’t work. Try again.");
  }

  return (
    <div>
      <Button
        variant="link"
        onClick={toggle}
        disabled={busy || saved === null}
        aria-pressed={saved === true}
      >
        {saved ? "Remove from saved" : "Save this piece"}
      </Button>
      {error ? (
        <p className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
