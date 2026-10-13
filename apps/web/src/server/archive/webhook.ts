import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Fourthwall signs each delivery: X-Fourthwall-Hmac-SHA256 = base64(HMAC-SHA256(secret, raw body)). */
export function verifyWebhookSignature(
  raw: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(raw, "utf8").digest();
  let given: Buffer;
  try {
    given = Buffer.from(header, "base64");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}
