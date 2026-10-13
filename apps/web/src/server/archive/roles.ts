import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { audit } from "./audit";
import type { RoleRow } from "./types";

type Role = RoleRow["role"];

export async function listAdmins(): Promise<RoleRow[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from("user_roles").select("*").eq("role", "admin");
  return (data ?? []) as RoleRow[];
}

export async function grantRole(userId: string, role: Role, grantedBy: string | null) {
  if (!supabaseAdmin) throw new Error("database not configured");
  const { error } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role, granted_by: grantedBy }, { onConflict: "user_id,role" });
  if (error) throw new Error(`grant failed: ${error.message}`);
  await audit(grantedBy, "role.grant", "user", userId, null, { role });
}

export async function revokeRole(userId: string, role: Role, revokedBy: string | null) {
  if (!supabaseAdmin) throw new Error("database not configured");
  const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", role);
  if (error) throw new Error(`revoke failed: ${error.message}`);
  await audit(revokedBy, "role.revoke", "user", userId, { role }, null);
}

/** Exact (case-insensitive) match on the sign-in address; refuses when more than one user matches. */
export async function findUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
  if (!supabaseAdmin) throw new Error("database not configured");
  const wanted = email.trim().toLowerCase();
  const matches: { id: string; email: string }[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`user lookup failed: ${error.message}`);
    for (const u of data.users) if (u.email?.toLowerCase() === wanted) matches.push({ id: u.id, email: u.email! });
    if (data.users.length < 200) break;
  }
  if (matches.length > 1) throw new Error(`more than one user matches ${wanted}`);
  return matches[0] ?? null;
}
