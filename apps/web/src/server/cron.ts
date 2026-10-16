import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "./env";

/**
 * The crons in vercel.json and the IndexNow deploy workflow send CRON_SECRET as the bearer token.
 * Returns the answer for a request without it, or null to go ahead.
 */
export function cronDenied(request: NextRequest): NextResponse | null {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron not configured" }, { status: 503 });
  const given = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}
