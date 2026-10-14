/**
 * Posts a signed, made-up Fourthwall order event to a running site so the purchase flow can be
 * walked without a real order: the webhook links the order to the account with that email (guest
 * provenance), unlocks the design, and with --registered first records a checkout session for the
 * account so the order counts as made while signed in (the Founding Member rule).
 *
 * Usage: pnpm --filter @awebound/web archive:webhook -- --email you@example.com --slug thorns-to-lilies
 *          [--status CONFIRMED] [--type ORDER_PLACED|ORDER_UPDATED] [--order <id>] [--quantity 1]
 *          [--registered] [--test] [--url http://localhost:3000/api/fourthwall/webhook] [--dry-run]
 *
 * Re-send the same --order with --type ORDER_UPDATED --status REFUNDED to see a refund land.
 * Needs FOURTHWALL_WEBHOOK_SECRET in .env.local (the dev server must use the same value);
 * --registered also needs the Supabase variables.
 */
import { createHmac, randomUUID } from "node:crypto";
import { arg, hasFlag, requireEnv } from "./_env";

const email = arg("--email");
const slug = arg("--slug");
if (!email || !slug) {
  console.error("Usage: archive:webhook -- --email <address> --slug <product-slug> [options]");
  process.exit(1);
}
const secret = requireEnv("FOURTHWALL_WEBHOOK_SECRET");
const type = arg("--type") ?? "ORDER_PLACED";
const status = arg("--status") ?? "CONFIRMED";
const quantity = Number(arg("--quantity") ?? "1");
const orderId = arg("--order") ?? `local-${Date.now().toString(36)}`;
const url = arg("--url") ?? "http://localhost:3000/api/fourthwall/webhook";
const testMode = hasFlag("--test");

const { brandContent } = await import("../src/server/content");
const { getCatalog } = await import("../src/server/catalog");

const content = brandContent.products.find((p) => p.slug === slug);
if (!content) {
  console.error(`No design with the slug ${slug} in catalog.json.`);
  process.exit(1);
}
const catalog = await getCatalog().catch(() => null);
const variant = catalog?.findBySlug(slug)?.variants[0] ?? null;
const sku = variant?.sku ?? `${slug}-fixture`;
const color = variant?.color ?? "Black";
const size = variant?.size ?? content.sizes[0] ?? "M";
const unit = content.priceCents / 100;

let checkoutId: string | null = null;
if (hasFlag("--registered")) {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  requireEnv("SUPABASE_SECRET_KEY");
  const { findUserByEmail } = await import("../src/server/archive/roles");
  const { recordCheckoutSession } = await import("../src/server/archive/orders");
  const user = await findUserByEmail(email);
  if (!user) {
    console.error("No account signs in with that address. Sign in once first.");
    process.exit(1);
  }
  checkoutId = `cart-${randomUUID()}`;
  await recordCheckoutSession({
    cartId: checkoutId,
    user: { id: user.id, email: user.email, email_confirmed_at: new Date().toISOString() },
    lines: [{ sku, productSlug: slug, color, size, quantity }],
  });
}

const now = new Date().toISOString();
const order = {
  id: orderId,
  friendlyId: `AW-${orderId.slice(-6).toUpperCase()}`,
  checkoutId,
  email,
  status,
  source: { type: "ORDER" },
  createdAt: now,
  updatedAt: now,
  amounts: {
    total: { value: unit * quantity, currency: "USD" },
    refunded: { value: status.toUpperCase() === "REFUNDED" ? unit * quantity : 0, currency: "USD" },
  },
  offers: [
    {
      id: `offer-${content.fourthwallSlug}`,
      name: content.name,
      slug: content.fourthwallSlug,
      quantity,
      variant: {
        id: sku,
        attributes: { color: { name: color }, size: { name: size } },
        unitPrice: { value: unit, currency: "USD" },
      },
    },
  ],
};
const envelope = {
  id: `evt-${randomUUID()}`,
  type,
  apiVersion: "V1",
  testMode,
  shopId: "local",
  createdAt: now,
  // ORDER_UPDATED is delivered with the order wrapped; ORDER_PLACED carries it flat.
  data: type === "ORDER_UPDATED" ? { order } : order,
};
const body = JSON.stringify(envelope);
const signature = createHmac("sha256", secret).update(body, "utf8").digest("base64");

console.info(
  `order ${orderId} (${type}, ${status}${testMode ? ", test mode" : ""}${checkoutId ? ", registered checkout" : ""}) → ${url}`,
);
if (hasFlag("--dry-run")) {
  console.info(`x-fourthwall-hmac-sha256: ${signature}`);
  console.info(JSON.stringify(envelope, null, 2));
  process.exit(0);
}

const response = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", "x-fourthwall-hmac-sha256": signature },
  body,
});
const text = await response.text();
console.info(`${response.status} ${text}`);
if (!response.ok) process.exit(1);
console.info(`Re-send this order later with: --order ${orderId}`);
