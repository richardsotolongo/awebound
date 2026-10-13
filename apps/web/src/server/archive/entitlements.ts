import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { OrderLineRow } from "./types";

/**
 * What an account owns, by design: the sum of eligible units over its linked, paid, real
 * (not test), ordinary orders. Every protected read goes through here.
 */
export interface Entitlement {
  designKey: string;
  quantity: number;
  firstPaidAt: string | null;
  variants: { color: string | null; size: string | null; quantity: number }[];
  orders: { id: string; friendlyId: string | null }[];
}

interface EntitlementView {
  user_id: string;
  design_key: string;
  quantity: number;
  first_paid_at: string | null;
}

async function variantsFor(userId: string, designKeys: string[]) {
  const lines = new Map<string, Entitlement["variants"]>();
  const orders = new Map<string, Map<string, string | null>>();
  if (!supabaseAdmin || designKeys.length === 0) return { lines, orders };
  const { data } = await supabaseAdmin
    .from("provider_order_lines")
    .select("design_key, color, size, eligible_quantity, order:provider_orders!inner(id, friendly_id, user_id, payment_state, test_mode, source_type)")
    .in("design_key", designKeys)
    .eq("order.user_id", userId)
    .eq("order.payment_state", "paid")
    .eq("order.test_mode", false)
    .eq("order.source_type", "ORDER")
    .gt("eligible_quantity", 0);
  type Row = Pick<OrderLineRow, "design_key" | "color" | "size" | "eligible_quantity"> & {
    order: { id: string; friendly_id: string | null };
  };
  for (const row of (data ?? []) as unknown as Row[]) {
    const key = row.design_key!;
    const list = lines.get(key) ?? [];
    const same = list.find((v) => v.color === row.color && v.size === row.size);
    if (same) same.quantity += row.eligible_quantity;
    else list.push({ color: row.color, size: row.size, quantity: row.eligible_quantity });
    lines.set(key, list);
    const o = orders.get(key) ?? new Map<string, string | null>();
    o.set(row.order.id, row.order.friendly_id);
    orders.set(key, o);
  }
  return { lines, orders };
}

export async function listEntitlements(userId: string): Promise<Entitlement[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.from("archive_entitlements").select("*").eq("user_id", userId);
  if (error) throw new Error(`entitlements read failed: ${error.message}`);
  const rows = (data ?? []) as EntitlementView[];
  const { lines, orders } = await variantsFor(
    userId,
    rows.map((r) => r.design_key),
  );
  return rows.map((r) => ({
    designKey: r.design_key,
    quantity: r.quantity,
    firstPaidAt: r.first_paid_at,
    variants: lines.get(r.design_key) ?? [],
    orders: [...(orders.get(r.design_key) ?? new Map())].map(([id, friendlyId]) => ({ id, friendlyId })),
  }));
}

export async function getEntitlement(userId: string, designKey: string): Promise<Entitlement | null> {
  const all = await listEntitlements(userId);
  return all.find((e) => e.designKey === designKey && e.quantity > 0) ?? null;
}
