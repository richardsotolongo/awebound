import "server-only";
import { createHash, randomInt } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "../email";
import { claimCode } from "../email-templates";
import { UserError } from "../errors";
import { hasVerifiedEmail } from "../session";
import { audit } from "./audit";
import { getOrderByFriendlyId, platformConfigured } from "./fourthwall-platform";
import { hashEmail, logArchive } from "./log";
import { parseOrder } from "./order-parse";
import { upsertOrderFromParsed } from "./orders";
import type { ClaimRow, OrderRow } from "./types";

/**
 * Linking a past order placed as a guest: the shopper gives the order number, a code goes to the
 * email address on that order, and the code proves they can read that inbox. The response never
 * says whether the order exists, and the order's address is never shown or stored in clear.
 */
const CODE_MINUTES = 15;
const MAX_ATTEMPTS = 5;

function admin() {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  return supabaseAdmin;
}

const codeHash = (code: string, claimId: string) =>
  createHash("sha256").update(`${code}:${claimId}`).digest("hex");

async function findOrder(friendlyId: string): Promise<OrderRow | null> {
  const db = admin();
  const { data } = await db
    .from("provider_orders")
    .select("*")
    .eq("friendly_id", friendlyId)
    .limit(2);
  const local = (data ?? []) as OrderRow[];
  if (local.length === 1) return local[0]!;
  if (local.length > 1) return null;
  if (!platformConfigured()) return null;
  try {
    const parsed = parseOrder(await getOrderByFriendlyId(friendlyId));
    if (!parsed) return null;
    await upsertOrderFromParsed(parsed, { source: "reconcile", testMode: false });
    const { data: stored } = await db
      .from("provider_orders")
      .select("*")
      .eq("id", parsed.id)
      .maybeSingle();
    return (stored as OrderRow | null) ?? null;
  } catch {
    return null;
  }
}

export async function startClaim(
  user: User,
  friendlyIdInput: string,
): Promise<{ claimId: string }> {
  if (!hasVerifiedEmail(user)) throw new UserError("Confirm your email address first.");
  const db = admin();
  const friendlyId = friendlyIdInput.trim().replace(/^#/, "");
  const order = await findOrder(friendlyId);
  const claimable =
    order && !order.test_mode && order.email && (!order.user_id || order.user_id === user.id);
  const { data, error } = await db
    .from("order_claims")
    .insert({
      user_id: user.id,
      order_id: claimable ? order.id : null,
      friendly_id: friendlyId,
      email_hash: claimable ? hashEmail(order.email!) : "",
      code_hash: "",
      expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      status: claimable ? "pending" : "unmatched",
    })
    .select("id")
    .single();
  if (error) throw new Error(`claim insert failed: ${error.message}`);
  const claimId = (data as { id: string }).id;
  if (claimable) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await db
      .from("order_claims")
      .update({ code_hash: codeHash(code, claimId) })
      .eq("id", claimId);
    await sendEmail(order.email!, claimCode({ code, friendlyId }));
  }
  logArchive("claim", { user: user.id, claim: claimId, matched: Boolean(claimable) });
  return { claimId };
}

export async function verifyClaim(
  user: User,
  claimId: string,
  code: string,
): Promise<{ friendlyId: string }> {
  const db = admin();
  const { data } = await db
    .from("order_claims")
    .select("*")
    .eq("id", claimId)
    .eq("user_id", user.id)
    .maybeSingle();
  const claim = data as ClaimRow | null;
  const wrong = new UserError("That code didn’t work. Check it, or start again.");
  if (!claim || claim.status === "unmatched" || claim.status === "verified") throw wrong;
  if (claim.status === "failed" || claim.attempts >= MAX_ATTEMPTS)
    throw new UserError("Too many tries. Wait a few minutes and try again.");
  if (new Date(claim.expires_at).getTime() < Date.now()) {
    await db.from("order_claims").update({ status: "expired" }).eq("id", claimId);
    throw new UserError("This code has expired. Start again.");
  }
  if (codeHash(code, claimId) !== claim.code_hash) {
    const attempts = claim.attempts + 1;
    await db
      .from("order_claims")
      .update({ attempts, ...(attempts >= MAX_ATTEMPTS ? { status: "failed" } : {}) })
      .eq("id", claimId);
    throw wrong;
  }
  const { error } = await db
    .from("provider_orders")
    .update({
      user_id: user.id,
      link_method: "claim",
      registered_checkout: false,
      linked_at: new Date().toISOString(),
    })
    .eq("id", claim.order_id!)
    .is("user_id", null);
  if (error) throw new Error(`claim link failed: ${error.message}`);
  await db
    .from("order_claims")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("id", claimId);
  await audit(user.id, "order.claim", "order", claim.order_id, null, { method: "claim" });
  logArchive("claim", { user: user.id, claim: claimId, verified: true });
  return { friendlyId: claim.friendly_id };
}
