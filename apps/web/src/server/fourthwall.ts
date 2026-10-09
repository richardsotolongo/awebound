import { z } from "zod";
import { serverEnv } from "./env";

/** Typed client for the Fourthwall Storefront API (https://docs.fourthwall.com/storefront/overview). */

const API_URL = "https://storefront-api.fourthwall.com/v1";
export const CURRENCY = "USD";

const Image = z.object({ url: z.string(), transformedUrl: z.string().nullish() });

const Variant = z.object({
  id: z.string(),
  unitPrice: z.object({ value: z.number().min(0), currency: z.string() }),
  attributes: z.object({
    color: z.object({ name: z.string(), swatch: z.string().nullish() }).nullish(),
    size: z.object({ name: z.string() }).nullish(),
  }),
  stock: z.object({ type: z.string(), inStock: z.number().nullish() }),
  images: z.array(Image).nullish(),
});

// Only "PRODUCT" entries parse, so bundles are skipped (the site sells single pieces).
const Product = z.object({
  type: z.literal("PRODUCT"),
  slug: z.string(),
  state: z.object({ type: z.string() }),
  access: z.object({ type: z.string() }).nullish(),
  images: z.array(Image),
  variants: z.array(Variant),
});

const Page = z.object({
  results: z.array(z.unknown()),
  paging: z.object({ hasNextPage: z.boolean() }),
});

export type FourthwallProduct = z.infer<typeof Product>;
export type FourthwallVariant = z.infer<typeof Variant>;

export class FourthwallApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

async function request(path: string, init: RequestInit = {}, params: Record<string, string> = {}) {
  const token = serverEnv.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) throw new Error("FOURTHWALL_STOREFRONT_TOKEN is not set");
  const url = new URL(`${API_URL}${path}`);
  url.search = new URLSearchParams({ ...params, storefront_token: token, currency: CURRENCY }).toString();

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { accept: "application/json", "content-type": "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new FourthwallApiError(0, undefined, `Fourthwall unreachable: ${String(err)}`);
  }
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const code = (json as { code?: unknown } | null)?.code;
    throw new FourthwallApiError(
      res.status,
      code ? String(code) : undefined,
      `Fourthwall ${path} failed with ${res.status}`,
    );
  }
  return json;
}

/** Every product in the shop's "all" collection. Cached for a minute by Next's data cache. */
export async function listProducts(): Promise<FourthwallProduct[]> {
  const products: FourthwallProduct[] = [];
  for (let page = 0; page < 40; page++) {
    const body = Page.parse(
      await request(
        "/collections/all/products",
        { next: { revalidate: 60 } },
        { page: String(page), size: "50" },
      ),
    );
    for (const item of body.results) {
      const parsed = Product.safeParse(item);
      if (parsed.success) products.push(parsed.data);
      else if ((item as { type?: unknown }).type === "PRODUCT") {
        const field = parsed.error.issues[0]?.path.join(".");
        console.warn(`[fourthwall] skipped a product with an unexpected shape (${field})`);
      }
    }
    if (!body.paging.hasNextPage) break;
  }
  return products;
}

/** Creates a cart holding the given variants; its id goes into the hosted checkout URL. */
export async function createCart(
  items: { variantId: string; quantity: number }[],
  metadata: Record<string, string>,
): Promise<string> {
  const cart = z
    .object({ id: z.string() })
    .parse(await request("/carts", { method: "POST", body: JSON.stringify({ items, metadata }) }));
  return cart.id;
}
