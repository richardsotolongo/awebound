"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { unsavePieceAction } from "@/server/archive-actions";

export function RemoveSavedButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true);
    setError("");
    const result = await unsavePieceAction({ slug }).catch(() => null);
    if (result?.ok) router.refresh();
    else {
      setBusy(false);
      setError(result?.error ?? "That didn’t work. Try again.");
    }
  }
  return (
    <div className="archive-saved-remove">
      <Button variant="secondary" onClick={remove} disabled={busy}>
        {busy ? "Removing…" : "Remove"}
      </Button>
      {error ? (
        <p className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
