"use client";

import Link from "next/link";
import { HeartIcon } from "@/components/icons";
import { track } from "@/lib/analytics";
import { accountsEnabled } from "@/lib/env";
import { usePath } from "@/lib/pathname";
import { useSavedPieces } from "./saved-store";

/**
 * A heart that saves the piece to My Archive: outlined, filled once saved. Signed out it leads to
 * sign-in and back. `card` sits in the bottom right of a product image; `page` stands beside Add
 * to bag. Nothing shows while accounts are off.
 */
export function SaveHeart({
  slug,
  name,
  variant = "card",
}: {
  slug: string;
  name: string;
  variant?: "card" | "page";
}) {
  const { signedIn, slugs, error, toggle } = useSavedPieces();
  const pathname = usePath();
  if (!accountsEnabled) return null;

  const className = `save-heart save-heart-${variant}`;
  const size = variant === "page" ? 22 : 20;
  if (!signedIn) {
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent(pathname)}`}
        className={className}
        aria-label={`Sign in to save ${name}`}
      >
        <HeartIcon size={size} />
      </Link>
    );
  }
  const saved = slugs?.has(slug) ?? false;

  async function toggleSaved() {
    if (await toggle(slug))
      track(saved ? "saved_piece_removed" : "piece_saved", { product_slug: slug });
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={`Save ${name}`}
        aria-pressed={saved}
        disabled={slugs === null}
        onClick={() => void toggleSaved()}
      >
        <HeartIcon size={size} filled={saved} />
      </button>
      {variant === "page" && error ? (
        <p className="aw-form-error save-heart-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
