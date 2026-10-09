import type { z } from "zod";
import { ProfileSchema, type UpdateProfileRequest } from "./account";
import {
  CatalogFacetsSchema,
  CollectionSchema,
  ProductDetailSchema,
  ProductListSchema,
  type ProductQueryInput,
} from "./catalog";
import {
  BagSchema,
  CheckoutResultSchema,
  type BagValidateRequest,
  type CheckoutRequest,
} from "./commerce";
import { ApiError, ApiErrorBodySchema } from "./errors";
import { OkSchema, type ContactRequest, type SubscribeRequest } from "./messages";

export interface ApiClientOptions {
  /** API origin, e.g. http://localhost:4000. */
  baseUrl: string;
  /** Supabase access token for signed-in calls. */
  getAccessToken?: () => Promise<string | null | undefined> | string | null | undefined;
  fetch?: typeof fetch;
  /** Defaults merged into every request (for example Next.js caching options). */
  init?: RequestInit;
}

type Query = Record<string, string | number | boolean | string[] | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Query;
  body?: unknown;
  auth?: boolean;
  init?: RequestInit;
}

/** Serializes a query object; arrays become comma-separated values. */
export function toSearchParams(query: Query): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  return params;
}

export function createApiClient(options: ApiClientOptions) {
  const fetcher = options.fetch ?? fetch;
  const base = options.baseUrl.replace(/\/$/, "");

  async function request<S extends z.ZodType>(
    schema: S,
    path: string,
    opts: RequestOptions = {},
  ): Promise<z.infer<S>> {
    const qs = opts.query ? toSearchParams(opts.query).toString() : "";
    const headers = new Headers(options.init?.headers);
    new Headers(opts.init?.headers).forEach((v, k) => headers.set(k, v));
    headers.set("accept", "application/json");
    if (opts.body !== undefined) headers.set("content-type", "application/json");
    if (opts.auth) {
      const token = await options.getAccessToken?.();
      if (token) headers.set("authorization", `Bearer ${token}`);
    }

    let res: Response;
    try {
      res = await fetcher(`${base}${path}${qs ? `?${qs}` : ""}`, {
        ...options.init,
        ...opts.init,
        method: opts.method ?? "GET",
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
    } catch {
      throw new ApiError(
        0,
        "unavailable",
        "The store is unreachable right now. Try again in a moment.",
      );
    }

    const text = await res.text();
    const json: unknown = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const parsed = ApiErrorBodySchema.safeParse(json);
      if (parsed.success) {
        const { code, message, fields } = parsed.data.error;
        throw new ApiError(res.status, code, message, fields);
      }
      throw new ApiError(res.status, "internal", "Something went wrong on our side.");
    }
    return schema.parse(json);
  }

  return {
    listProducts: (query: ProductQueryInput = {}, init?: RequestInit) =>
      request(ProductListSchema, "/v1/products", { query: query as Query, init }),
    getFacets: (query: ProductQueryInput = {}, init?: RequestInit) =>
      request(CatalogFacetsSchema, "/v1/products/facets", { query: query as Query, init }),
    getProduct: (slug: string, init?: RequestInit) =>
      request(ProductDetailSchema, `/v1/products/${encodeURIComponent(slug)}`, { init }),
    listCollections: (init?: RequestInit) =>
      request(CollectionSchema.array(), "/v1/collections", { init }),
    validateBag: (body: BagValidateRequest) =>
      request(BagSchema, "/v1/bag/validate", { method: "POST", body }),
    startCheckout: (body: CheckoutRequest) =>
      request(CheckoutResultSchema, "/v1/checkout", { method: "POST", body, auth: true }),
    sendContact: (body: ContactRequest) =>
      request(OkSchema, "/v1/contact", { method: "POST", body, auth: true }),
    subscribe: (body: SubscribeRequest) =>
      request(OkSchema, "/v1/subscribers", { method: "POST", body }),
    getMe: () => request(ProfileSchema, "/v1/me", { auth: true }),
    updateMe: (body: UpdateProfileRequest) =>
      request(ProfileSchema, "/v1/me", { method: "PATCH", body, auth: true }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
