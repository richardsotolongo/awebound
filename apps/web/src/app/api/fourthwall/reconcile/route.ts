import { NextResponse, type NextRequest } from "next/server";
import { reconcileOrders } from "@/server/archive/reconcile";
import { cronDenied } from "@/server/cron";
import { UserError } from "@/server/errors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** The daily reconcile (vercel.json crons). Vercel sends CRON_SECRET as the bearer token. */
export async function GET(request: NextRequest) {
  const denied = cronDenied(request);
  if (denied) return denied;
  try {
    const report = await reconcileOrders({ trigger: "cron" });
    return NextResponse.json(report, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    const message = err instanceof UserError ? err.message : "reconcile failed";
    if (!(err instanceof UserError)) console.error(err);
    return NextResponse.json({ error: message }, { status: err instanceof UserError ? 503 : 500 });
  }
}
