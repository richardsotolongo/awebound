"use client";

import { Button } from "@awebound/brand";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="aw-container section"
      style={{ display: "grid", gap: "var(--space-6)", justifyItems: "start" }}
    >
      <p className="aw-label">Something went wrong</p>
      <h1 className="aw-h1">We couldn’t load this page</h1>
      <p className="aw-body">
        Try again in a moment. If it keeps happening, write to contact@awebound.store.
      </p>
      <div className="aw-btn-row">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <Button variant="secondary" href="/">
          Go home
        </Button>
      </div>
    </div>
  );
}
