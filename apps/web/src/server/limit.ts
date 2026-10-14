import "server-only";
import { headers } from "next/headers";
import { UserError } from "./errors";

const hits = new Map<string, number[]>();

/**
 * Sliding-window limit per IP, or per `key` (a user id) when given, for actions that send email,
 * create carts or render files. In memory, so per server instance (docs/TODOS.md: a Vercel
 * Firewall rule is the stronger guard).
 */
export async function limit(action: string, max: number, minutes: number, key?: string) {
  const who = key ?? ((await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local");
  const id = `${action}:${who}`;
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < minutes * 60_000);
  if (recent.length >= max)
    throw new UserError("Too many tries. Wait a few minutes and try again.");
  hits.set(id, [...recent, now]);
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.every((t) => now - t > 60 * 60_000)) hits.delete(k);
  }
}
