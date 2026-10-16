import { NextResponse, type NextRequest } from "next/server";
import { cronDenied } from "@/server/cron";
import { syncIndexNow } from "@/server/indexnow";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Sends IndexNow the pages that are new, changed or gone. Called by the daily cron (vercel.json)
 * and after each production deploy (.github/workflows/indexnow.yml), with CRON_SECRET as the
 * bearer token. `?dry=1` reports what would be sent without sending it. Answers 502 when
 * IndexNow turns the submission down, so the deploy workflow shows it.
 */
export async function GET(request: NextRequest) {
  const denied = cronDenied(request);
  if (denied) return denied;
  try {
    const report = await syncIndexNow({ dryRun: request.nextUrl.searchParams.has("dry") });
    const refused = report.status !== undefined && report.status !== 200 && report.status !== 202;
    return NextResponse.json(report, {
      status: refused ? 502 : 200,
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "IndexNow failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
