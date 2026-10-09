import { ApiError, createApiClient } from "@awebound/shared";
import { publicEnv } from "./env";

const baseUrl = process.env.API_URL?.trim() || publicEnv.NEXT_PUBLIC_API_URL;

/**
 * Server-side API client for Server Components. Catalog reads are cached for a minute
 * (incremental revalidation), matching the API's own Cache-Control.
 */
export const serverApi = createApiClient({
  baseUrl,
  init: { next: { revalidate: 60 } },
});

/** Runs a catalog read and falls back when the API is down, so pages still render. */
export async function withFallback<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) throw error;
    console.error("[awebound] API read failed:", error instanceof Error ? error.message : error);
    return fallback;
  }
}
