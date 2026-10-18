import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCatalog } from "../catalog";
import { getArchiveOffer } from "./offer";
import type { CheckoutSessionRow, OrderLineRow, OrderRow } from "./types";

/**
 * Guest purchases and My Archive: a guest's paid order opens its designs once an account with the
 * order's email exists (autoLinkByEmail), so the site tells the buyer, on the band under the
 * header and in the next morning's email (follow-ups.ts).
 */

const DAY = 24 * 60 * 60_000;

export type GuestOrder = Pick<
  OrderRow,
  | "id"
  | "email"
  | "payment_state"
  | "test_mode"
  | "source_type"
  | "user_id"
  | "paid_at"
  | "first_seen_at"
> & {
  lines: Pick<OrderLineRow, "product_slug" | "design_key" | "eligible_quantity" | "offer_name">[];
};

export const GUEST_ORDER_COLUMNS =
  "id, email, payment_state, test_mode, source_type, user_id, paid_at, first_seen_at, lines:provider_order_lines(product_slug, design_key, eligible_quantity, offer_name)";

const designLines = (o: GuestOrder) =>
  o.lines.filter((l) => l.design_key && l.eligible_quantity > 0);

/** Paid, real, still unlinked, and an account would open at least one design for it. */
export const opensForGuest = (o: GuestOrder) =>
  o.payment_state === "paid" &&
  !o.test_mode &&
  o.source_type === "ORDER" &&
  !o.user_id &&
  designLines(o).length > 0;

/** The pieces these orders open, by their catalog names (the order's own name for a piece that's gone). */
export async function pieceNames(orders: GuestOrder[]): Promise<string[]> {
  const catalog = await getCatalog().catch(() => null);
  const names = orders
    .flatMap(designLines)
    .map(
      (l) => (l.product_slug && catalog?.findBySlug(l.product_slug)?.name) || l.offer_name || "",
    );
  return [...new Set(names.filter(Boolean))];
}

/**
 * What a browser that checked out as a guest hears about its carts: `paid` ones whose order an
 * account would open (for 30 days), `waiting` ones whose order hasn't arrived (for 3 days), and
 * the pieces' names. Every other cart is left out, so the browser forgets it.
 */
export async function guestOrderStatus(
  cartIds: string[],
): Promise<{ names: string[]; paid: string[]; waiting: string[] }> {
  // Until orders reach accounts there is nothing to promise; the browser keeps its carts.
  if (!supabaseAdmin || !(await getArchiveOffer()).orders)
    return { names: [], paid: [], waiting: cartIds };
  const { data: sessionData, error } = await supabaseAdmin
    .from("checkout_sessions")
    .select("cart_id, created_at, matched_order_id")
    .in("cart_id", cartIds)
    .is("user_id", null);
  if (error) throw new Error(`guest checkouts read failed: ${error.message}`);
  const sessions = (sessionData ?? []) as Pick<
    CheckoutSessionRow,
    "cart_id" | "created_at" | "matched_order_id"
  >[];
  const orderIds = sessions.flatMap((s) => (s.matched_order_id ? [s.matched_order_id] : []));
  const read = orderIds.length
    ? await supabaseAdmin.from("provider_orders").select(GUEST_ORDER_COLUMNS).in("id", orderIds)
    : { data: [], error: null };
  if (read.error) throw new Error(`guest orders read failed: ${read.error.message}`);
  const orders = new Map(((read.data ?? []) as GuestOrder[]).map((o) => [o.id, o]));

  const now = Date.now();
  const opened: GuestOrder[] = [];
  const paid: string[] = [];
  const waiting: string[] = [];
  for (const s of sessions) {
    const order = s.matched_order_id ? orders.get(s.matched_order_id) : undefined;
    if (order && opensForGuest(order)) {
      if (now - Date.parse(order.paid_at ?? order.first_seen_at) < 30 * DAY) {
        opened.push(order);
        paid.push(s.cart_id);
      }
    } else if (
      (!order || order.payment_state === "pending" || order.payment_state === "unknown") &&
      now - Date.parse(s.created_at) < 3 * DAY
    ) {
      waiting.push(s.cart_id);
    }
  }
  return { names: await pieceNames(opened), paid, waiting };
}
