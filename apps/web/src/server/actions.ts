"use server";

import { headers } from "next/headers";
import {
  BagValidateRequestSchema,
  CheckoutRequestSchema,
  ContactRequestSchema,
  ProductQuerySchema,
  SubscribeRequestSchema,
  UpdateProfileRequestSchema,
  type Bag,
  type BagValidateRequest,
  type CheckoutRequest,
  type CheckoutResult,
  type ContactRequest,
  type ProductList,
  type ProductQueryInput,
  type SubscribeRequest,
  type UpdateProfileRequest,
} from "@/shared";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import * as account from "./account";
import * as bag from "./bag";
import { searchProducts } from "./catalog";
import { parse, run, UserError, type Result } from "./errors";
import { submitContactMessage, subscribeToDropNotes } from "./messages";

// Server Actions are public endpoints: every input is parsed, and the user comes from the session.

const hits = new Map<string, number[]>();

/** Per-IP limit for actions that send email or create carts. In memory, so per server instance. */
async function limit(action: string, max: number, minutes: number) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${action}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < minutes * 60_000);
  if (recent.length >= max)
    throw new UserError("Too many tries. Wait a few minutes and try again.");
  hits.set(key, [...recent, now]);
}

async function currentUser() {
  const supabase = await getServerSupabase();
  return (await supabase?.auth.getUser())?.data.user ?? null;
}

export async function validateBag(input: BagValidateRequest): Promise<Result<Bag>> {
  return run(() => bag.validateBag(parse(BagValidateRequestSchema, input).lines));
}

export async function startCheckout(input: CheckoutRequest): Promise<Result<CheckoutResult>> {
  return run(async () => {
    await limit("checkout", 30, 10);
    const { lines } = parse(CheckoutRequestSchema, input);
    return bag.startCheckout(lines, (await currentUser())?.id);
  });
}

export async function loadMoreProducts(input: ProductQueryInput): Promise<Result<ProductList>> {
  return run(() => searchProducts(parse(ProductQuerySchema, input)));
}

export async function sendContact(input: ContactRequest): Promise<Result<null>> {
  return run(async () => {
    await limit("contact", 5, 10);
    const { website, ...message } = parse(ContactRequestSchema, input);
    // Honeypot filled in: answer as if sent, send nothing.
    if (!website) await submitContactMessage(message, (await currentUser())?.id);
    return null;
  });
}

export async function subscribe(input: SubscribeRequest): Promise<Result<null>> {
  return run(async () => {
    await limit("subscribe", 10, 10);
    await subscribeToDropNotes(parse(SubscribeRequestSchema, input));
    return null;
  });
}

export async function updateProfile(
  input: UpdateProfileRequest,
): Promise<Result<{ fullName: string }>> {
  return run(async () => {
    const { fullName } = parse(UpdateProfileRequestSchema, input);
    const user = await currentUser();
    if (!user) throw new UserError("Sign in again to update your profile.");
    if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
    // Upsert: the sign-up trigger normally creates the row, but older users may not have one.
    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: user.id, email: user.email, full_name: fullName });
    if (error) throw new Error(`profile update failed: ${error.message}`);
    return { fullName };
  });
}

/** Deletes the signed-in shopper's account (see server/account.ts) and clears the session. */
export async function deleteAccount(): Promise<Result<null>> {
  return run(async () => {
    const supabase = await getServerSupabase();
    const user = (await supabase?.auth.getUser())?.data.user;
    if (!supabase || !user) throw new UserError("Sign in again to delete your account.");
    await account.deleteAccount(user);
    // The user no longer exists, so only the local session cookies need clearing.
    await supabase.auth.signOut({ scope: "local" });
    return null;
  });
}
