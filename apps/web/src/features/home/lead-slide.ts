import { pieceStatus, priceLabel } from "@/features/catalog/query";
import type { ProductDetail, ScriptureQuote } from "@/shared";

/** What the lead piece shows for one piece: public catalog data, the same as its card. */
export interface LeadSlide {
  slug: string;
  name: string;
  cut: string;
  price: string;
  status: string | null;
  /** One sentence on what the art shows. */
  art: string;
  scripture: ScriptureQuote;
}

export function toLeadSlide(piece: ProductDetail): LeadSlide {
  return {
    slug: piece.slug,
    name: piece.name,
    cut: piece.category.cut,
    price: priceLabel(piece),
    status: pieceStatus(piece) ?? null,
    art: piece.story.art,
    scripture: piece.scripture,
  };
}
