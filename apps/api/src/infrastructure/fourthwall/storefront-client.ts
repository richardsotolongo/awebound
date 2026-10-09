import { z } from "zod";

/**
 * Minimal typed client for the Fourthwall Storefront API
 * (https://docs.fourthwall.com/storefront/overview). Server-side only: the storefront token
 * stays in the API's environment.
 */

const API_URL = "https://storefront-api.fourthwall.com/v1";
const TIMEOUT_MS = 10_000;

const Money = z.object({ value: z.number().min(0), currency: z.string() });

const Image = z.object({
  id: z.string(),
  url: z.string(),
  transformedUrl: z.string().nullish(),
  width: z.number().nullish(),
  height: z.number().nullish(),
});

const Variant = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullish(),
  unitPrice: Money,
  attributes: z.object({
    description: z.string().nullish(),
    color: z.object({ name: z.string(), swatch: z.string().nullish() }).nullish(),
    size: z.object({ name: z.string() }).nullish(),
  }),
  stock: z.object({ type: z.string(), inStock: z.number().nullish() }),
  images: z.array(Image).nullish(),
});

const Product = z.object({
  type: z.literal("PRODUCT"),
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  state: z.string(),
  access: z.string().nullish(),
  images: z.array(Image),
  variants: z.array(Variant),
});

const Page = z.object({
  results: z.array(z.unknown()),
  paging: z.object({ hasNextPage: z.boolean() }),
});

const Cart = z.object({ id: z.string() });

export type FourthwallProduct = z.infer<typeof Product>;
export type FourthwallVariant = z.infer<typeof Variant>;

export class FourthwallApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "FourthwallApiError";
  }
}

export interface FourthwallConfig {
  storefrontToken: string;
  currency: string;
}

export class FourthwallStorefront {
  constructor(private readonly config: FourthwallConfig) {}

  private async request(path: string, init: RequestInit = {}, params: Record<string, string> = {}) {
    const url = new URL(`${API_URL}${path}`);
    url.searchParams.set("storefront_token", this.config.storefrontToken);
    url.searchParams.set("currency", this.config.currency);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          ...init.headers,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      throw new FourthwallApiError(0, undefined, `Fourthwall unreachable: ${String(err)}`);
    }
    const text = await res.text();
    const json: unknown = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const code =
        json && typeof json === "object" && "code" in json
          ? String((json as { code: unknown }).code)
          : undefined;
      throw new FourthwallApiError(
        res.status,
        code,
        `Fourthwall ${path} failed with ${res.status}`,
      );
    }
    return json;
  }

  /** Every product in the shop's "all" collection. Bundles are skipped (the site sells single pieces). */
  async listProducts(): Promise<FourthwallProduct[]> {
    const products: FourthwallProduct[] = [];
    for (let page = 0; page < 40; page++) {
      const body = Page.parse(
        await this.request("/collections/all/products", {}, { page: String(page), size: "50" }),
      );
      for (const item of body.results) {
        const parsed = Product.safeParse(item);
        if (parsed.success) products.push(parsed.data);
      }
      if (!body.paging.hasNextPage) break;
    }
    return products;
  }

  /** Creates a cart holding the given variants; the cart id goes into the hosted checkout URL. */
  async createCart(
    items: { variantId: string; quantity: number }[],
    metadata: Record<string, string> = {},
  ): Promise<{ id: string }> {
    return Cart.parse(
      await this.request("/carts", { method: "POST", body: JSON.stringify({ items, metadata }) }),
    );
  }
}
