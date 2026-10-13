import "server-only";
import type { ShareFormat } from "@/shared";
import { getProduct } from "../catalog";
import { UserError } from "../errors";
import { getPublishedForExport } from "./content";
import { renderDesignCardPdf } from "./pdf";
import { renderShareImage } from "./share";

/**
 * Renders are cached in memory by the published content's id, so a new version replaces the
 * file at once; nothing inside is specific to a buyer, so the cache is safe across accounts.
 * Entitlement checks happen in the route handlers before anything here runs.
 */
const cache = new Map<string, Promise<Uint8Array>>();

async function published(slug: string) {
  const [card, product] = await Promise.all([getPublishedForExport(slug), getProduct(slug)]);
  if (!card || !product) throw new UserError("This design isn’t published yet.");
  return { ...card, product };
}

export async function designCardPdf(slug: string): Promise<Uint8Array> {
  const { design, content, product } = await published(slug);
  const key = `pdf:${content.id}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = renderDesignCardPdf(design, content, product).catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, pending);
  }
  return pending;
}

export async function shareImage(slug: string, format: ShareFormat): Promise<Uint8Array> {
  const { design, content, product } = await published(slug);
  const key = `share:${content.id}:${format}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = renderShareImage(design, content, product, format).catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, pending);
  }
  return pending;
}
