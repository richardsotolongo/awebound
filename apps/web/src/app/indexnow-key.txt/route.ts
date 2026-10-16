import { serverEnv } from "@/server/env";

/** The IndexNow key file. Search engines read it to confirm a submission came from this site. */
export function GET() {
  const key = serverEnv.INDEXNOW_KEY;
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
