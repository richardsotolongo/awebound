import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { removeIdeaImages } from "./archive/ideas";
import { sendEmail } from "./email";
import { accountDeleted } from "./email-templates";
import { UserError } from "./errors";

/**
 * Deletes the shopper's sign-in, profile (cascades from auth.users) and drop-notes subscription.
 * The cascade also removes their saved pieces, fit, consents, claims, roles and idea submissions
 * (their images are removed first); their order rows and any Founding place stay with the user id
 * set to null (a place is never recycled). Contact messages stay as support history; their user_id
 * is set to null. Fourthwall keeps orders.
 */
export async function deleteAccount(user: { id: string; email?: string | null }): Promise<void> {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  const email = user.email?.trim().toLowerCase();

  if (email) {
    const { error } = await supabaseAdmin.from("subscribers").delete().eq("email", email);
    if (error) throw new Error(`subscriber delete failed: ${error.message}`);
  }
  await removeIdeaImages(user.id);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(`user delete failed: ${error.message}`);

  if (email) {
    await sendEmail(email, accountDeleted()).catch((err: unknown) =>
      console.warn("[account] deletion email failed:", err),
    );
  }
}
