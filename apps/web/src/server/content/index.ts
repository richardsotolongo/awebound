import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  CategorySchema,
  CollectionSchema,
  mediaAt,
  SizeGuideSchema,
  type Category,
  type Collection,
  type Color,
  type Media,
  type Plate,
  type ProductImage,
  type ProductStory,
  type ScriptureQuote,
  type SizeGuide,
} from "@/shared";
import { PieceContentSchema, SizeGuideContentSchema, type PieceContent } from "@/shared/pieces";
import { quote } from "../scripture";
import raw from "./catalog.json";

const BrandContentSchema = z.object({
  categories: z.array(
    CategorySchema.extend({
      /** Sizes a preview product offers until Fourthwall supplies the real ones. */
      sizes: z.array(z.string()).min(1),
    }),
  ),
  collections: z.array(CollectionSchema),
  colors: z.record(z.string(), z.string()),
  /** Garment measurements per blank, keyed by an id products refer to. */
  sizeGuides: z.record(z.string(), SizeGuideContentSchema),
  products: z.array(z.unknown()),
});
export type RawContent = z.infer<typeof BrandContentSchema>;

/** One design's brand story and images. Fourthwall supplies what can be bought: variants, prices, stock. */
export interface ProductContent {
  code: string;
  slug: string;
  name: string;
  /** Slug of the matching Fourthwall product (`slug` unless the content sets `fourthwallSlug`). */
  fourthwallSlug: string;
  /** The Fourthwall offer id its orders arrive under, once known. */
  fourthwallOfferId: string | null;
  collection: Collection;
  position: number;
  category: Category;
  /** Brand garment colors for the design; the first is the base color. */
  colors: Color[];
  /** Preview price and sizes, used until the product is in Fourthwall. */
  priceCents: number;
  /** Preview price per size where it differs from `priceCents`. */
  sizePriceCents: Record<string, number>;
  sizes: string[];
  /** Key of the product's size guide, and its measurements (null when there isn't a guide yet). */
  sizeGuideId: string | null;
  sizeGuide: SizeGuide | null;
  featured: boolean;
  releasedAt: string;
  /** The piece's verse in the website's translation. */
  scripture: ScriptureQuote;
  story: ProductStory;
  /** The site's styled product images (Fourthwall renders or mockups), in display order. */
  images: [ProductImage, ...ProductImage[]];
  plate: Plate | null;
  media: Media;
}

export interface BrandContent {
  categories: Category[];
  collections: Collection[];
  /** Garment color name → brand token, for matching Fourthwall color names. */
  colorTokens: Record<string, string>;
  products: ProductContent[];
  /** Where it came from: the database, or catalog.json when the database can't be read. */
  source: "database" | "file";
}

/** The tag on the catalog's database reads, refreshed when the owner publishes or edits a piece. */
export const CATALOG_CONTENT_TAG = "catalog-content";

const file = BrandContentSchema.parse(raw);

/** Resolves one piece's collection, category, colors and size guide; throws what is wrong. */
function resolvePiece(content: RawContent, p: PieceContent): ProductContent {
  const category = content.categories.find((c) => c.slug === p.category);
  const collection = content.collections.find((c) => c.slug === p.collection);
  if (!category) throw new Error(`unknown category ${p.category}`);
  if (!collection) throw new Error(`unknown collection ${p.collection}`);
  // A color the brand tokens don't know shows Fourthwall's swatch, or a neutral one (colorCss).
  const colors = p.colors.map((name) => ({ name, token: content.colors[name] ?? "" }));

  const [first, ...rest] = p.images;
  if (!first) throw new Error("needs at least one image");

  let sizeGuide: SizeGuide | null = null;
  if (p.sizeGuide) {
    const found = content.sizeGuides[p.sizeGuide];
    if (!found) throw new Error(`unknown size guide ${p.sizeGuide}`);
    // `blank` stays on the server: the site never names the supplier.
    const guide: SizeGuide = SizeGuideSchema.parse(found);
    for (const row of guide.rows) {
      if (row.values.length !== guide.measures.length)
        throw new Error(`${p.sizeGuide}: ${row.size} needs ${guide.measures.length} values`);
    }
    sizeGuide = guide;
  }
  const sizes = sizeGuide ? sizeGuide.rows.map((r) => r.size) : category.sizes;
  for (const size of Object.keys(p.sizePriceCents ?? {})) {
    if (!sizes.includes(size)) throw new Error(`price for unknown size ${size}`);
  }

  return {
    code: p.code,
    slug: p.slug,
    name: p.name,
    fourthwallSlug: p.fourthwallSlug ?? p.slug,
    fourthwallOfferId: p.fourthwallOfferId ?? null,
    collection,
    position: p.position,
    category: { slug: category.slug, name: category.name, cut: category.cut },
    colors,
    priceCents: p.priceCents,
    sizePriceCents: p.sizePriceCents ?? {},
    sizes,
    sizeGuideId: p.sizeGuide ?? null,
    sizeGuide,
    featured: p.featured,
    releasedAt: p.releasedAt,
    scripture: quote(p.scripture),
    story: p.story,
    images: [first, ...rest],
    plate: p.plate ?? null,
    media: p.media ?? mediaAt(`/products/${p.slug}`),
  };
}

/**
 * Resolves every piece. One that doesn't hold together is left out and logged, so a bad row
 * never takes the rest of the catalog down with it.
 */
export function resolveContent(content: RawContent, source: BrandContent["source"]): BrandContent {
  const products: ProductContent[] = [];
  for (const item of content.products) {
    const parsed = PieceContentSchema.safeParse(item);
    const slug = (item as { slug?: unknown } | null)?.slug;
    if (!parsed.success) {
      console.error(`[catalog] left out ${String(slug)}: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    try {
      products.push(resolvePiece(content, parsed.data));
    } catch (err) {
      console.error(`[catalog] left out ${parsed.data.slug}: ${(err as Error).message}`);
    }
  }
  return {
    categories: content.categories.map(({ slug, name, cut }) => ({ slug, name, cut })),
    collections: content.collections,
    colorTokens: content.colors,
    products,
    source,
  };
}

/** Throws what is wrong with one piece against the given content, for the owner's forms. */
export function checkPiece(content: RawContent, piece: PieceContent): void {
  resolvePiece(content, piece);
}

/** catalog.json, as the site shows it when the database can't be read. */
export const fileContent: BrandContent = resolveContent(file, "file");

// The columns the public may read (supabase/migrations/20261018000000_catalog.sql).
const COLLECTION_COLUMNS = "id, slug, name, number, tagline, story, scripture_ref, position";
const PIECE_COLUMNS =
  "slug, code, name, collection_id, position, category, colors, price_cents, size_price_cents, size_guide_id, scripture, story, plate, images, media, featured, released_at, fourthwall_slug, fourthwall_offer_id";
const GUIDE_COLUMNS = "id, name, fit, note, tolerance, image, measures, rows";

interface CollectionRow {
  id: string;
  slug: string;
  name: string;
  number: string;
  tagline: string;
  story: string;
  scripture_ref: string;
}
interface PieceRow {
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
  scripture: unknown;
  story: unknown;
  plate: unknown;
  images: unknown;
  media: unknown;
  featured: boolean;
  released_at: string;
  fourthwall_slug: string;
  fourthwall_offer_id: string | null;
}
type GuideRow = SizeGuide & { id: string };

/** The raw content behind the given client: the catalog's tables, with categories and colors from catalog.json. */
export async function readContent(db: SupabaseClient): Promise<RawContent> {
  const [collections, pieces, guides] = await Promise.all([
    db.from("collections").select(COLLECTION_COLUMNS).order("position"),
    db.from("pieces").select(PIECE_COLUMNS).order("position"),
    db.from("size_guides").select(GUIDE_COLUMNS),
  ]);
  const error = collections.error ?? pieces.error ?? guides.error;
  if (error) throw new Error(`catalog read failed: ${error.message}`);

  const collectionRows = (collections.data ?? []) as CollectionRow[];
  const slugOf = new Map(collectionRows.map((c) => [c.id, c.slug]));
  return {
    categories: file.categories,
    colors: file.colors,
    collections: collectionRows.map((c) => ({
      slug: c.slug,
      name: c.name,
      number: c.number,
      tagline: c.tagline,
      story: c.story,
      scriptureRef: c.scripture_ref,
    })),
    sizeGuides: Object.fromEntries(
      ((guides.data ?? []) as GuideRow[]).map(({ id, ...guide }) => [id, { ...guide, blank: "" }]),
    ),
    products: ((pieces.data ?? []) as PieceRow[]).map((p) => ({
      code: p.code,
      slug: p.slug,
      name: p.name,
      collection: slugOf.get(p.collection_id) ?? "",
      category: p.category,
      position: p.position,
      colors: p.colors,
      priceCents: p.price_cents,
      sizePriceCents: p.size_price_cents,
      featured: p.featured,
      releasedAt: p.released_at,
      scripture: p.scripture,
      fourthwallSlug: p.fourthwall_slug,
      fourthwallOfferId: p.fourthwall_offer_id ?? undefined,
      sizeGuide: p.size_guide_id ?? undefined,
      story: p.story,
      images: p.images,
      plate: p.plate ?? undefined,
      media: p.media,
    })),
  };
}

/**
 * The publishable key and no session: row-level security shows only published releases, their
 * published pieces and the size guides those use. Reads go through Next's data cache for a minute
 * (like Fourthwall's product list) under CATALOG_CONTENT_TAG; outside Next the option is ignored.
 */
const publicDb =
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ? createClient(
        publicEnv.NEXT_PUBLIC_SUPABASE_URL,
        publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) =>
              fetch(input, {
                ...init,
                signal: AbortSignal.timeout(10_000),
                next: { revalidate: 60, tags: [CATALOG_CONTENT_TAG] },
              }),
          },
        },
      )
    : null;

/** The published catalog, once per request. catalog.json when the database isn't set up or can't be read. */
export const getBrandContent = cache(async (): Promise<BrandContent> => {
  if (!publicDb) return fileContent;
  try {
    return resolveContent(await readContent(publicDb), "database");
  } catch (err) {
    console.error("[catalog] using catalog.json:", err instanceof Error ? err.message : err);
    return fileContent;
  }
});

/** Every release and piece, drafts included, for the owner's pages and previews. Never cached. */
export async function getAllContent(): Promise<BrandContent> {
  if (!supabaseAdmin) return fileContent;
  return resolveContent(await readContent(supabaseAdmin), "database");
}
