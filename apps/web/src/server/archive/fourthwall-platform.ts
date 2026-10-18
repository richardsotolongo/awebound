import "server-only";
import { z } from "zod";
import { serverEnv } from "../env";
import { FourthwallApiError } from "../fourthwall";
import { logArchive } from "./log";

/**
 * Fourthwall's Platform (Open) API, with the shop's API user (Basic auth): orders (one by id or
 * friendly id, and the paged list for reconciliation) and products (read, find by slug, made
 * public or hidden by the owner's publishing). Response shapes are logged once per process as
 * key names (never values) so the first real call documents them.
 */

const API_URL = "https://api.fourthwall.com/open-api/v1.0";
const logged = new Set<string>();

export function platformConfigured(): boolean {
  return Boolean(serverEnv.FOURTHWALL_API_USERNAME && serverEnv.FOURTHWALL_API_PASSWORD);
}

async function request(
  path: string,
  params: Record<string, string> = {},
  write?: { method: "PUT"; body: unknown },
): Promise<unknown> {
  const user = serverEnv.FOURTHWALL_API_USERNAME;
  const pass = serverEnv.FOURTHWALL_API_PASSWORD;
  if (!user || !pass) throw new Error("Fourthwall API user is not set");
  const url = new URL(`${API_URL}${path}`);
  url.search = new URLSearchParams(params).toString();
  let res: Response;
  try {
    res = await fetch(url, {
      method: write?.method ?? "GET",
      headers: {
        accept: "application/json",
        authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`,
        ...(write && { "content-type": "application/json" }),
      },
      ...(write && { body: JSON.stringify(write.body) }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new FourthwallApiError(0, undefined, `Fourthwall unreachable: ${String(err)}`);
  }
  const json: unknown = await res.json().catch(() => null);
  const scope = path.replace(/\/[^/]*[0-9][^/]*/g, "/{id}");
  if (!logged.has(scope)) {
    logged.add(scope);
    const body = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
    const first = Array.isArray(body?.results) ? body.results[0] : null;
    logArchive("platform", {
      path: scope,
      status: res.status,
      keys: body ? Object.keys(body) : null,
      firstKeys: first && typeof first === "object" ? Object.keys(first) : null,
    });
  }
  if (!res.ok) {
    const code = (json as { code?: unknown } | null)?.code;
    throw new FourthwallApiError(
      res.status,
      code ? String(code) : undefined,
      `Fourthwall ${scope} failed with ${res.status}`,
    );
  }
  return json;
}

export async function getOrder(id: string): Promise<unknown> {
  return request(`/order/${encodeURIComponent(id)}`);
}

export async function getOrderByFriendlyId(friendlyId: string): Promise<unknown> {
  return request(`/order/by-friendly-id/${encodeURIComponent(friendlyId)}`);
}

/** One page of the shop's orders, newest first where the API supports it. */
export async function listOrders(
  page: number,
  size = 50,
): Promise<{ results: unknown[]; hasNextPage: boolean }> {
  const body = (await request("/order", { page: String(page), size: String(size) })) as Record<
    string,
    unknown
  > | null;
  const results = Array.isArray(body?.results) ? body.results : Array.isArray(body) ? body : [];
  const paging = body?.paging as Record<string, unknown> | undefined;
  return { results, hasNextPage: Boolean(paging?.hasNextPage) };
}

// Products (Fourthwall calls them offers). Only the fields the catalog admin reads.
const PlatformOfferSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  access: z.object({ type: z.string() }),
  state: z.object({ type: z.string() }),
  variants: z.array(
    z.object({
      id: z.string(),
      unitPrice: z.object({ value: z.number(), currency: z.string() }),
      attributes: z.object({ size: z.object({ name: z.string() }).nullish() }).nullish(),
    }),
  ),
});
export type PlatformOffer = z.infer<typeof PlatformOfferSchema>;
export type OfferVisibility = "PUBLIC" | "HIDDEN";

/** A product by id, or null when the shop has none with that id. */
export async function getOffer(id: string): Promise<PlatformOffer | null> {
  try {
    return PlatformOfferSchema.parse(await request(`/products/${encodeURIComponent(id)}`));
  } catch (err) {
    if (err instanceof FourthwallApiError && err.status === 404) return null;
    throw err;
  }
}

/** One page of the shop's products (up to 100), hidden and archived ones included. */
export async function listOffers(page = 0, search?: string): Promise<PlatformOffer[]> {
  const body = (await request("/products", {
    page: String(page),
    size: "100",
    ...(search && { search }),
  })) as { results?: unknown[] } | null;
  return (body?.results ?? []).flatMap((item) => {
    const parsed = PlatformOfferSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Every product with exactly this slug (Fourthwall keeps archived ones under the same slug). */
export async function findOffersBySlug(slug: string): Promise<PlatformOffer[]> {
  return (await listOffers(0, slug)).filter((o) => o.slug === slug);
}

/** Lists a product in the shop (PUBLIC) or unlists it (HIDDEN). Never archives. */
export async function setOfferState(id: string, state: OfferVisibility): Promise<PlatformOffer> {
  return PlatformOfferSchema.parse(
    await request(
      `/products/${encodeURIComponent(id)}/state`,
      {},
      { method: "PUT", body: { state } },
    ),
  );
}
