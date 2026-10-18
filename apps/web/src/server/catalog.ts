import "server-only";
import { cache } from "react";
import { ProductQuerySchema, type ProductQueryInput } from "@/shared";
import { mergeFourthwallCatalog } from "./catalog-merge";
import { CatalogIndex } from "./catalog-search";
import { getAllContent, getBrandContent, type BrandContent } from "./content";
import { serverEnv } from "./env";
import { listProducts } from "./fourthwall";

let lastMismatch = "";

async function buildCatalog(content: BrandContent) {
  const live = serverEnv.FOURTHWALL_STOREFRONT_TOKEN ? await listProducts() : [];
  return mergeFourthwallCatalog(content, live);
}

/**
 * The live Fourthwall shop merged with the published brand content. Built once per request.
 * Without a storefront token (local development, or before Fourthwall is set up) every piece is a
 * preview.
 */
export const getCatalog = cache(async () => {
  const { catalog, unmatched, missing } = await buildCatalog(await getBrandContent());
  const mismatch = JSON.stringify({ notOnSite: unmatched, notInFourthwall: missing });
  if (mismatch !== lastMismatch && (unmatched.length || missing.length)) {
    console.warn(
      `[catalog] unmatched (Fourthwall-only hidden, site-only shown as previews): ${mismatch}`,
    );
  }
  lastMismatch = mismatch;
  return new CatalogIndex(catalog);
});

/** Every piece, drafts and unreleased collections included: the owner's preview. */
export async function getDraftCatalog() {
  return new CatalogIndex((await buildCatalog(await getAllContent())).catalog);
}

export async function searchProducts(query: ProductQueryInput = {}) {
  return (await getCatalog()).search(ProductQuerySchema.parse(query));
}

/**
 * Every piece on the site in the shop's default order, with no page limit: for the sitemap,
 * IndexNow, llms.txt and the guides, which must list every piece however many releases there are.
 */
export async function allProducts() {
  const query = ProductQuerySchema.parse({});
  return (await getCatalog()).search({ ...query, pageSize: Number.MAX_SAFE_INTEGER }).items;
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

/** Releases with pieces on the site, newest first. */
export async function getReleases() {
  return (await getCatalog()).releases();
}

/** The newest release ("Latest Drop"), or null when the catalog is empty. */
export async function getLatestRelease() {
  return (await getCatalog()).latestRelease();
}
