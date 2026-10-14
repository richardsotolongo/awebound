import "server-only";

/**
 * Reads an order out of a webhook event or an Open API response without trusting its shape:
 * ORDER_PLACED carries the order flat in `data`, ORDER_UPDATED may wrap it as `data.order`, and
 * the line fields (`offers` with `variant`, quantity, per-line refunds) are only partly documented.
 * Whatever is missing stays null and is listed in `fieldsSeen` for the admin assumptions panel.
 */

export interface ParsedLine {
  offerId: string | null;
  offerSlug: string | null;
  offerName: string | null;
  variantId: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  quantityKnown: boolean;
  refundedQuantity: number | null;
  unitCents: number | null;
}

export interface ParsedOrder {
  id: string;
  friendlyId: string | null;
  checkoutId: string | null;
  email: string | null;
  status: string | null;
  sourceType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  totalCents: number | null;
  refundedCents: number;
  lines: ParsedLine[];
  fieldsSeen: string[];
  raw: unknown;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null;
const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : null;
const int = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.round(v)
    : typeof v === "string" && /^\d+$/.test(v)
      ? Number(v)
      : null;

/** `{ value, currency }`, a number or a numeric string, to cents. */
function money(v: unknown): number | null {
  const o = obj(v);
  const n = o ? o.value : v;
  if (typeof n === "number" && Number.isFinite(n)) return Math.round(n * 100);
  if (typeof n === "string" && /^-?\d+(\.\d+)?$/.test(n)) return Math.round(Number(n) * 100);
  return null;
}

function parseLine(v: unknown): ParsedLine | null {
  const line = obj(v);
  if (!line) return null;
  const offer = obj(line.offer);
  const variant = obj(line.variant);
  const attrs = obj(variant?.attributes);
  const quantity = int(line.quantity) ?? int(variant?.quantity);
  return {
    offerId: str(line.offerId) ?? str(offer?.id) ?? (variant ? str(line.id) : null) ?? str(line.id),
    offerSlug: str(line.slug) ?? str(offer?.slug),
    offerName: str(line.name) ?? str(offer?.name),
    variantId: str(line.variantId) ?? str(variant?.id),
    color: str(obj(attrs?.color)?.name) ?? str(obj(variant?.color)?.name) ?? str(line.color),
    size: str(obj(attrs?.size)?.name) ?? str(obj(variant?.size)?.name) ?? str(line.size),
    quantity: quantity ?? 1,
    quantityKnown: quantity !== null,
    refundedQuantity: int(line.refundedQuantity) ?? int(line.quantityRefunded),
    unitCents: money(line.price) ?? money(line.unitPrice) ?? money(variant?.unitPrice),
  };
}

export function parseOrder(data: unknown): ParsedOrder | null {
  const outer = obj(data);
  const order = obj(outer?.order) ?? outer;
  if (!order) return null;
  const id = str(order.id);
  if (!id) return null;
  const amounts = obj(order.amounts);
  const rawLines = [order.offers, order.items, order.lineItems, order.lines].find(Array.isArray) as
    unknown[] | undefined;
  const lines = (rawLines ?? []).map(parseLine).filter((l): l is ParsedLine => l !== null);
  const firstLine = obj(rawLines?.[0]);
  const fieldsSeen = [
    ...Object.keys(order).map((k) => `order.${k}`),
    ...(firstLine ? Object.keys(firstLine).map((k) => `line.${k}`) : []),
    ...(obj(firstLine?.variant)
      ? Object.keys(obj(firstLine?.variant)!).map((k) => `line.variant.${k}`)
      : []),
  ];
  return {
    id,
    friendlyId: str(order.friendlyId),
    checkoutId: str(order.checkoutId),
    email: str(order.email) ?? str(obj(order.customer)?.email) ?? str(obj(order.billing)?.email),
    status: str(order.status) ?? str(obj(order.status)?.type),
    sourceType: str(obj(order.source)?.type) ?? str(order.sourceType),
    createdAt: str(order.createdAt),
    updatedAt: str(order.updatedAt),
    totalCents: money(amounts?.total) ?? money(order.total),
    refundedCents:
      money(amounts?.refunded) ?? money(order.refunded) ?? money(order.refundedAmount) ?? 0,
    lines,
    fieldsSeen,
    raw: data,
  };
}
