import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { reconcileOrders } from "@/server/archive/reconcile";
import { serverEnv } from "@/server/env";
import { UserError } from "@/server/errors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** The daily reconcile (vercel.json crons). Vercel sends CRON_SECRET as the bearer token. */
export async function GET(request: NextRequest) {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron not configured" }, { status: 503 });
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const report = await reconcileOrders({ trigger: "cron" });
    return NextResponse.json(report, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    const message = err instanceof UserError ? err.message : "reconcile failed";
    if (!(err instanceof UserError)) console.error(err);
    return NextResponse.json({ error: message }, { status: err instanceof UserError ? 503 : 500 });
  }
}
