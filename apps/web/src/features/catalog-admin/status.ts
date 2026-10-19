import type { PieceStatus } from "@/shared/pieces";

/** A piece's status as the owner reads it. */
export const PIECE_STATUS: Record<PieceStatus, string> = {
  draft: "Draft",
  in_review: "Approved, waiting for its collection",
  published: "Published",
};
