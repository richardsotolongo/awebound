"use client";

import { Button } from "@awebound/brand";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { deleteAccount } from "@/server/actions";

/** Two steps on purpose: deleting an account can't be undone. */
export function DeleteAccount({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "confirm" | "deleting" | "deleted">("idle");
  const [error, setError] = useState("");

  async function confirm() {
    setState("deleting");
    setError("");
    const result = await deleteAccount().catch(() => null);
    if (result?.ok) {
      // The server cleared its cookies; this updates the header to "Sign in".
      await getBrowserSupabase()?.auth.signOut({ scope: "local" });
      setState("deleted");
    } else {
      setState("confirm");
      setError(result?.error ?? "Your account wasn’t deleted. Try again in a moment.");
    }
  }

  if (state === "deleted") {
    return (
      <div className="notice" role="status">
        <p className="aw-h3">Your account is deleted</p>
        <p className="aw-small">A confirmation is on its way to {email}.</p>
        <div>
          <Button variant="secondary" href="/shop">
            Back to the shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="account-delete">
      <p className="aw-body">
        This removes your sign-in, your profile and your drop-notes subscription. Orders stay with
        Fourthwall for receipts and returns.
      </p>
      {state === "idle" ? (
        <div>
          <Button variant="secondary" onClick={() => setState("confirm")}>
            Delete account
          </Button>
        </div>
      ) : (
        <div className="notice" role="group" aria-labelledby="delete-confirm-title">
          <p id="delete-confirm-title" className="aw-h3">
            Delete your account?
          </p>
          <p className="aw-small">
            You can’t undo this. You can still order as a guest whenever ordering is open.
          </p>
          <div className="account-actions">
            <Button variant="primary" onClick={confirm} disabled={state === "deleting"}>
              {state === "deleting" ? "Deleting…" : "Delete my account"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setState("idle")}
              disabled={state === "deleting"}
            >
              Keep my account
            </Button>
          </div>
          {error ? (
            <p className="aw-form-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
