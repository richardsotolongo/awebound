import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { queueEmail } from "@/server/archive/email-outbox";
import { logArchive } from "@/server/archive/log";
import { parseOrder } from "@/server/archive/order-parse";
import { upsertOrderFromParsed } from "@/server/archive/orders";
import { verifyWebhookSignature } from "@/server/archive/webhook";
import { serverEnv } from "@/server/env";
import { getCatalog } from "@/server/catalog";
import { FOURTHWALL_CATALOG_TAG } from "@/server/fourthwall";

export const dynamic = "force-dynamic";

/**
 * Fourthwall's webhooks. The raw body is verified against the shop's secret
 * (X-Fourthwall-Hmac-SHA256, base64 HMAC-SHA256) and every event is stored once by its id.
 * ORDER_PLACED and ORDER_UPDATED link orders; deliveries can repeat and arrive out of order, and
 * the reconcile job covers what never arrives. A product or collection change refreshes the cached
 * product list, and with it every page that read it, so prices and stock show within seconds (a
 * Fourthwall product still appears only once its piece is published in Admin).
 */

const Envelope = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  apiVersion: z.string().optional(),
  testMode: z.boolean().optional(),
  shopId: z.string().optional(),
  createdAt: z.string().optional(),
  data: z.unknown(),
});

const ORDER_EVENTS = new Set(["ORDER_PLACED", "ORDER_UPDATED"]);
const CATALOG_EVENTS = new Set(["PRODUCT_CREATED", "PRODUCT_UPDATED", "COLLECTION_UPDATED"]);

export async function POST(request: NextRequest) {
  const secret = serverEnv.FOURTHWALL_WEBHOOK_SECRET;
  if (!secret || !supabaseAdmin)
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });

  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-fourthwall-hmac-sha256"), secret)) {
    logArchive("webhook", { ok: false, reason: "signature", bytes: raw.length });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const envelope = Envelope.safeParse(json);
  if (!envelope.success) return NextResponse.json({ error: "invalid envelope" }, { status: 400 });
  const event = envelope.data;

  // Once per event id: a repeat is acknowledged without doing anything, unless the first try failed.
  const { error: insertError } = await supabaseAdmin.from("webhook_events").insert({
    id: event.id,
    type: event.type,
    api_version: event.apiVersion ?? null,
    test_mode: event.testMode === true,
    shop_id: event.shopId ?? null,
    payload: json as object,
  });
  if (insertError) {
    if (insertError.code !== "23505")
      throw new Error(`event insert failed: ${insertError.message}`);
    const { data: seen } = await supabaseAdmin
      .from("webhook_events")
      .select("status")
      .eq("id", event.id)
      .maybeSingle();
    if ((seen as { status: string } | null)?.status !== "failed")
      return NextResponse.json({ ok: true, duplicate: true });
  }

  const finish = async (
    status: "processed" | "ignored" | "failed",
    patch: Record<string, unknown> = {},
  ) => {
    await supabaseAdmin!
      .from("webhook_events")
      .update({ status, processed_at: new Date().toISOString(), ...patch })
      .eq("id", event.id);
  };

  if (CATALOG_EVENTS.has(event.type)) {
    revalidateTag(FOURTHWALL_CATALOG_TAG, { expire: 0 });
    await finish("processed");
    return NextResponse.json({ ok: true });
  }

  if (!ORDER_EVENTS.has(event.type)) {
    await finish("ignored", { notes: { reason: "type" } });
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const parsed = parseOrder(event.data);
  if (!parsed) {
    await finish("failed", { error: "unparsable order" });
    return NextResponse.json({ ok: true, ignored: "unparsable" });
  }

  try {
    const result = await upsertOrderFromParsed(parsed, {
      source: "webhook",
      testMode: event.testMode === true,
    });
    if (result.unlocked.length > 0) {
      const catalog = await getCatalog().catch(() => null);
      const { data: order } = await supabaseAdmin
        .from("provider_orders")
        .select("user_id, email")
        .eq("id", parsed.id)
        .maybeSingle();
      const owner = order as { user_id: string | null; email: string | null } | null;
      for (const designKey of result.unlocked) {
        const slug = designKey.split(":")[1] ?? "";
        await queueEmail({
          template: "design_unlocked",
          userId: owner?.user_id ?? null,
          to: owner?.email ?? null,
          payload: { slug, name: catalog?.findBySlug(slug)?.name ?? slug },
        });
      }
    }
    await finish("processed", {
      order_id: parsed.id,
      notes: { ...result.notes, outOfOrder: result.outOfOrder, state: result.state },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finish("failed", { error: message, order_id: parsed.id });
    logArchive("webhook", { ok: false, event: event.id, error: message });
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
