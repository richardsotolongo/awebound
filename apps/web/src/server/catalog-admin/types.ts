import "server-only";
import type {
  Media,
  Plate,
  ProductImage,
  ProductStory,
  ScriptureRecord,
  SizeGuide,
} from "@/shared";
import type { PieceStatus } from "@/shared/pieces";

/** The catalog's rows as Postgres returns them (supabase/migrations/20261018000000_catalog.sql). */

export interface CollectionRow {
  id: string;
  slug: string;
  name: string;
  number: string;
  tagline: string;
  story: string;
  scripture_ref: string;
  cover_image: string | null;
  plate_image: string | null;
  preview_pdf_path: string | null;
  released_at: string | null;
  position: number;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PieceRow {
  id: string;
  slug: string;
  code: string;
  name: string;
  collection_id: string;
  position: number;
  category: string;
  colors: string[];
  price_cents: number;
  size_price_cents: Record<string, number>;
  size_guide_id: string | null;
  scripture: ScriptureRecord;
  story: ProductStory;
  plate: Plate | null;
  images: ProductImage[];
  media: Media;
  featured: boolean;
  released_at: string;
  fourthwall_slug: string;
  fourthwall_offer_id: string | null;
  status: PieceStatus;
  publish_with: Extras;
  import_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** What goes live with a piece besides itself. */
export interface Extras {
  archive: boolean;
  wallpapers: boolean;
}

export type SizeGuideRow = SizeGuide & { id: string; blank: string };

export interface ImportRow {
  id: string;
  zip_path: string;
  file_name: string;
  bytes: number | null;
  report: unknown;
  /** Reference files copied out of the zip: `fourthwall-1` … `fourthwall-4`, `site-preview`, `collection-preview`. */
  ref_paths: Record<string, string>;
  created_by: string | null;
  created_at: string;
}
