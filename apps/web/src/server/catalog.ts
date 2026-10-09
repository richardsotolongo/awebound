import "server-only";
import { cache } from "react";
import { ProductQuerySchema, type ProductQueryInput } from "@/shared";
import { mergeFourthwallCatalog } from "./catalog-merge";
import { CatalogIndex } from "./catalog-search";
import { brandContent } from "./content";
import { listProducts } from "./fourthwall";

let lastMismatch = "";

/** The live Fourthwall shop merged with the brand content. Built once per request. */
export const getCatalog = cache(async () => {
  const { catalog, unmatched, missing } = mergeFourthwallCatalog(
    brandContent,
    await listProducts(),
  );
  const mismatch = JSON.stringify({ notOnSite: unmatched, notInFourthwall: missing });
  if (mismatch !== lastMismatch && (unmatched.length || missing.length)) {
    console.warn(`[catalog] products without a match are hidden: ${mismatch}`);
  }
  lastMismatch = mismatch;
  return new CatalogIndex(catalog);
});

export async function searchProducts(query: ProductQueryInput = {}) {
  return (await getCatalog()).search(ProductQuerySchema.parse(query));
}

export async function getFacets(query: ProductQueryInput = {}) {
  return (await getCatalog()).facets(ProductQuerySchema.parse(query));
}

export async function getProduct(slug: string) {
  return (await getCatalog()).findBySlug(slug);
}

/** Runs a catalog read and falls back when Fourthwall is unreachable, so pages still render. */
export async function withFallback<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error("[catalog] read failed:", error instanceof Error ? error.message : error);
    return fallback;
  }
}
