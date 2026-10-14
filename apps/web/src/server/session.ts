import "server-only";
import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import { UserError } from "./errors";

export type Role = "admin";

/** The signed-in shopper from the session cookies; null when signed out or accounts are off. */
export const currentUser = cache(async (): Promise<User | null> => {
  const supabase = await getServerSupabase();
  return (await supabase?.auth.getUser())?.data.user ?? null;
});

export async function requireUser(message = "Sign in again to continue."): Promise<User> {
  const user = await currentUser();
  if (!user) throw new UserError(message);
  return user;
}

/** Google reports verified addresses and email sign-in confirms them; Archive benefits need one. */
export function hasVerifiedEmail(user: User): boolean {
  return Boolean(user.email && user.email_confirmed_at);
}

/** Roles live in user_roles (server-only), granted with `pnpm --filter @awebound/web grant:admin`. */
export const hasRole = cache(async (user: User | null, role: Role): Promise<boolean> => {
  if (!user || !supabaseAdmin) return false;
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", role)
    .maybeSingle();
  return Boolean(data);
});

/** Sensitive changes (the sign-in email) ask for a recent sign-in instead of a password. */
export function signedInRecently(user: User, minutes: number): boolean {
  if (!user.last_sign_in_at) return false;
  return Date.now() - new Date(user.last_sign_in_at).getTime() < minutes * 60_000;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!(await hasRole(user, "admin"))) throw new UserError("Not available.");
  return user;
}
