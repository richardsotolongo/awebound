"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Result } from "@/server/errors";

/** Runs one owner action, keeps its outcome as a line of text, and refreshes the server data on success. */
export function useOwnerAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function run<T>(action: () => Promise<Result<T>>, done: string | ((data: T) => string)) {
    setBusy(true);
    setMessage("");
    const result = await action().catch(() => null);
    setBusy(false);
    if (result?.ok) {
      setFailed(false);
      setMessage(typeof done === "string" ? done : done(result.data));
      router.refresh();
      return true;
    }
    setFailed(true);
    setMessage(
      result
        ? [result.error, ...Object.values(result.fields ?? {})].join(" ")
        : "That didn’t work. Try again in a moment.",
    );
    return false;
  }

  return { busy, message, failed, run };
}

/** The outcome line: a status while things go right, an alert when they don’t. */
export function Outcome({ message, failed }: { message: string; failed: boolean }) {
  return (
    <>
      <p className="field-help" role="status" aria-live="polite">
        {failed ? "" : message}
      </p>
      {failed ? (
        <p className="aw-form-error" role="alert">
          {message}
        </p>
      ) : null}
    </>
  );
}
