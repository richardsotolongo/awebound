import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Every owner change lands here (actor null = the command line). Never throws: the change stands. */
export async function audit(
  actor: string | null,
  action: string,
  targetType: string,
  targetId: string | null,
  before: unknown,
  after: unknown,
  reason?: string,
) {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin.from("owner_audit_log").insert({
    actor_user_id: actor,
    action,
    target_type: targetType,
    target_id: targetId,
    before: before ?? null,
    after: after ?? null,
    reason: reason ?? null,
  });
  if (error) console.error("[archive] audit insert failed:", error.message);
}
