import "server-only";
import { createHash } from "node:crypto";

/** sha256 of the lowercased, trimmed address: the only form an email takes in logs and claims. */
export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

const DROP = new Set([
  "email",
  "name",
  "address",
  "phone",
  "billing",
  "shipping",
  "payload",
  "raw",
  "to",
  "to_email",
]);

/** Logs counts and ids only: customer fields are dropped and anything email-shaped is hashed. */
export function logArchive(scope: string, fields: Record<string, unknown> = {}) {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (DROP.has(key)) continue;
    safe[key] =
      typeof value === "string" && /^[^\s@]+@[^\s@]+$/.test(value)
        ? hashEmail(value).slice(0, 8)
        : value;
  }
  console.info(`[archive:${scope}] ${JSON.stringify(safe)}`);
}
