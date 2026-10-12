import type { Release } from "@/shared";

/**
 * Whether a release can be ordered, in one plain sentence. Null once every piece can, when
 * there is nothing to say. A single piece speaks for itself (see pieceStatus).
 */
export function releaseStatusText(release: Pick<Release, "name" | "status">): string | null {
  if (release.status === "preview") return `Ordering for ${release.name} isn’t open yet.`;
  if (release.status === "partial")
    return `Some ${release.name} pieces can be ordered now. The rest are still in preview.`;
  return null;
}
