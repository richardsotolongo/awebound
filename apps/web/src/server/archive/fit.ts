import "server-only";
import type { FitGuide } from "@/shared";
import { brandContent } from "../content";

/**
 * The size guides by garment style (the two tee bodies, the hoodie, the two caps), for the owner's
 * Mappings page. The supplier's blank never leaves the server.
 */
export function listFitGuides(): FitGuide[] {
  const guides: FitGuide[] = [];
  for (const product of [...brandContent.products].sort((a, b) => a.position - b.position)) {
    const guide = product.sizeGuide;
    const id = guideIdFor(product.slug);
    if (!guide || !id || guides.some((g) => g.id === id)) continue;
    const sizes = guide.rows.map((r) => r.size);
    guides.push({
      id,
      name: guide.name,
      fit: guide.fit,
      note: guide.note,
      sizes,
      isCap: sizes.length === 1 && sizes[0] === "One size",
      guide,
    });
  }
  return guides;
}

/** The content file's guide key for a piece (products reference guides by key). */
function guideIdFor(slug: string): string | null {
  const entry = rawGuideKeys.get(slug);
  return entry ?? null;
}

// catalog.json keeps the guide key on each product; ProductContent resolves it to the guide
// object, so read the key once from the raw file for the id.
import raw from "../content/catalog.json";
const rawGuideKeys = new Map<string, string>(
  (raw as { products: { slug: string; sizeGuide?: string }[] }).products
    .filter((p) => p.sizeGuide)
    .map((p) => [p.slug, p.sizeGuide!]),
);

export function fitGuideForSlug(slug: string): FitGuide | null {
  const id = guideIdFor(slug);
  return listFitGuides().find((g) => g.id === id) ?? null;
}
