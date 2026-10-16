"use client";

import NextError from "next/error";
import { useEffect } from "react";
import { captureError } from "@/lib/analytics";

/** Replaces the root layout when it fails itself; route errors use error.tsx. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureError(error);
  }, [error]);

  return (
    <html lang="en" data-theme="dark">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
