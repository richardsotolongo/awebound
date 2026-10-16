"use client";

import { Button } from "@awebound/brand";
import { useEffect } from "react";
import { captureError } from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/shared";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    captureError(error);
  }, [error]);

  return (
    <div className="aw-container section stopped">
      <h1 className="aw-h1">We couldn’t load this page</h1>
      <p className="aw-body">
        Try again in a moment. If it keeps happening, write to {CONTACT_EMAIL}.
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
