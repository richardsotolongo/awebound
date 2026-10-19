import "server-only";
import type { User } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  IDEAS_EMAIL,
  IDEA_MAX_BYTES,
  ideaAllowance,
  type IdeaAllowance,
  type IdeaStatus,
  type IdeaSubmitRequest,
  type ShopperIdea,
} from "@/shared";
import { sendEmail } from "../email";
import { ideaSubmissionNotification } from "../email-templates";
import { UserError } from "../errors";
import { hasRole } from "../session";
import { readImageHeader } from "./assets";
import { audit } from "./audit";

/**
 * Idea Submissions. Shoppers with enough purchases send a design idea from My Archive (an image,
 * their idea, the verse and its context, any of them); the owner reviews them under Owner → Ideas.
 * Images go straight from the browser to a private bucket with a one-time signed URL, are checked
 * from their real bytes, and are read back only through short-lived signed URLs.
 */

export const IDEA_BUCKET = "idea-submissions";

interface IdeaRow {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  idea: string | null;
  verse: string | null;
  context: string | null;
  image_path: string | null;
  image_mime: string | null;
  image_width: number | null;
  image_height: number | null;
  image_bytes: number | null;
  purchases_at_submit: number | null;
  status: IdeaStatus;
  owner_note: string | null;
  reviewed_at: string | null;
  emailed_at: string | null;
  created_at: string;
}

function admin() {
  if (!supabaseAdmin) throw new UserError("Accounts aren’t set up yet.");
  return supabaseAdmin;
}

/**
 * Purchases: paid, real (not test), ordinary orders linked to the account with at least one line
 * still eligible, so an order refunded or cancelled in full no longer counts.
 */
export async function countPurchases(userId: string): Promise<number> {
  if (!supabaseAdmin) return 0;
  const { data, error } = await supabaseAdmin
    .from("provider_orders")
    .select("id, lines:provider_order_lines!inner(eligible_quantity)")
    .eq("user_id", userId)
    .eq("payment_state", "paid")
    .eq("test_mode", false)
    .eq("source_type", "ORDER")
    .gt("lines.eligible_quantity", 0);
  if (error) throw new Error(`purchase count failed: ${error.message}`);
  return new Set((data ?? []).map((o) => o.id)).size;
}

async function countSubmissions(userId: string): Promise<number> {
  const { count, error } = await admin()
    .from("idea_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("purchases_at_submit", "is", null);
  if (error) throw new Error(`submission count failed: ${error.message}`);
  return count ?? 0;
}

/** Where the account stands. The owner's own test submissions are never counted against anyone. */
export async function getIdeaAllowance(user: User): Promise<IdeaAllowance> {
  const [purchases, used, owner] = await Promise.all([
    countPurchases(user.id),
    countSubmissions(user.id),
    hasRole(user, "admin"),
  ]);
  return ideaAllowance(purchases, used, owner);
}

async function signedUrls(paths: string[], seconds: number): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data } = await admin().storage.from(IDEA_BUCKET).createSignedUrls(paths, seconds);
  for (const item of data ?? [])
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  return urls;
}

/** The account's own submissions, newest first, with their review status (never the owner's note). */
export async function listIdeasForUser(userId: string): Promise<ShopperIdea[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("idea_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`ideas read failed: ${error.message}`);
  const rows = (data ?? []) as IdeaRow[];
  const urls = await signedUrls(
    rows.flatMap((r) => (r.image_path ? [r.image_path] : [])),
    600,
  );
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    idea: r.idea,
    verse: r.verse,
    context: r.context,
    imageUrl: r.image_path ? (urls.get(r.image_path) ?? null) : null,
    status: r.status,
  }));
}

async function requireOpenSubmission(user: User): Promise<IdeaAllowance> {
  const allowance = await getIdeaAllowance(user);
  if (allowance.remaining > 0) return allowance;
  throw new UserError(
    allowance.unlocked
      ? `Your next submission opens after ${allowance.toNext} more ${allowance.toNext === 1 ? "purchase" : "purchases"}.`
      : "Idea Submissions open after 5 purchases.",
  );
}

/** A one-time upload target in the account's own folder of the private bucket. */
export async function createIdeaUploadTarget(user: User, fileName: string) {
  await requireOpenSubmission(user);
  const ext = /\.png$/i.test(fileName) ? "png" : "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await admin().storage.from(IDEA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`idea upload target failed: ${error?.message}`);
  return { bucket: IDEA_BUCKET, path, token: data.token };
}

const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

/** Records a submission, then emails it to the store inbox with the image attached. */
export async function submitIdea(
  user: User,
  input: Omit<IdeaSubmitRequest, "rights" | "website">,
): Promise<{ id: string }> {
  const allowance = await requireOpenSubmission(user);
  if (!user.email) throw new UserError("Add an email address to your account first.");

  let image: { path: string; bytes: Buffer; mime: string; width: number; height: number } | null =
    null;
  if (input.imagePath) {
    if (!input.imagePath.startsWith(`${user.id}/`)) throw new UserError("That upload isn’t yours.");
    const { data, error } = await admin().storage.from(IDEA_BUCKET).download(input.imagePath);
    if (error || !data) throw new UserError("Your image didn’t arrive. Choose it again.");
    const bytes = Buffer.from(await data.arrayBuffer());
    const header = readImageHeader(bytes);
    if (!header || bytes.length > IDEA_MAX_BYTES) {
      await admin().storage.from(IDEA_BUCKET).remove([input.imagePath]);
      throw new UserError("Send a PNG or JPEG image up to 10 MB.");
    }
    image = { path: input.imagePath, bytes, ...header };
  }

  const { data: profile } = await admin()
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name = clean(profile?.full_name ?? meta?.full_name ?? meta?.name)?.slice(0, 120) ?? null;
  const purchases = allowance.owner ? null : allowance.purchases;

  const { data, error } = await admin()
    .from("idea_submissions")
    .insert({
      user_id: user.id,
      email: user.email,
      name,
      idea: clean(input.idea),
      verse: clean(input.verse),
      context: clean(input.context),
      image_path: image?.path ?? null,
      image_mime: image?.mime ?? null,
      image_width: image?.width ?? null,
      image_height: image?.height ?? null,
      image_bytes: image?.bytes.length ?? null,
      purchases_at_submit: purchases,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`idea insert failed: ${error?.message}`);
  const row = data as IdeaRow;

  const imageName = image
    ? `idea-${row.id.slice(0, 8)}.${image.mime === "image/png" ? "png" : "jpg"}`
    : null;
  try {
    await sendEmail(
      IDEAS_EMAIL,
      ideaSubmissionNotification({
        id: row.id,
        name: row.name,
        email: row.email,
        idea: row.idea,
        verse: row.verse,
        context: row.context,
        imageName,
        purchases,
        inboxUrl: `${siteUrl}/account/admin/ideas`,
      }),
      row.email,
      image && imageName ? [{ filename: imageName, content: image.bytes }] : [],
    );
    await admin()
      .from("idea_submissions")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", row.id);
  } catch (err) {
    // The submission is stored and waits in Owner → Ideas either way.
    console.error("[ideas] notification failed:", err instanceof Error ? err.message : err);
  }
  return { id: row.id };
}

// Owner

export interface OwnerIdea extends IdeaRow {
  imageUrl: string | null;
  purchasesNow: number;
}

export async function listIdeas(status: IdeaStatus | null): Promise<OwnerIdea[]> {
  let query = admin()
    .from("idea_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`ideas read failed: ${error.message}`);
  const rows = (data ?? []) as IdeaRow[];
  const [urls, purchases] = await Promise.all([
    signedUrls(
      rows.flatMap((r) => (r.image_path ? [r.image_path] : [])),
      3600,
    ),
    Promise.all(
      [...new Set(rows.map((r) => r.user_id))].map(
        async (id) => [id, await countPurchases(id)] as const,
      ),
    ),
  ]);
  const now = new Map(purchases);
  return rows.map((r) => ({
    ...r,
    imageUrl: r.image_path ? (urls.get(r.image_path) ?? null) : null,
    purchasesNow: now.get(r.user_id) ?? 0,
  }));
}

export async function ideaCounts(): Promise<Record<IdeaStatus, number>> {
  const counts: Record<IdeaStatus, number> = { new: 0, reviewing: 0, selected: 0, declined: 0 };
  if (!supabaseAdmin) return counts;
  const { data } = await supabaseAdmin.from("idea_submissions").select("status");
  for (const r of (data ?? []) as { status: IdeaStatus }[]) counts[r.status] += 1;
  return counts;
}

export async function reviewIdea(id: string, status: IdeaStatus, note: string, actor: string) {
  const { data: before } = await admin()
    .from("idea_submissions")
    .select("status, owner_note")
    .eq("id", id)
    .maybeSingle();
  if (!before) throw new UserError("That submission is gone.");
  const { error } = await admin()
    .from("idea_submissions")
    .update({
      status,
      owner_note: note || null,
      reviewed_by: actor,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`idea review failed: ${error.message}`);
  await audit(actor, "idea.review", "idea_submission", id, before, {
    status,
    owner_note: note || null,
  });
}

/** Account deletion removes the person's images; the rows go with the account (cascade). */
export async function removeIdeaImages(userId: string) {
  if (!supabaseAdmin) return;
  const { data } = await supabaseAdmin
    .from("idea_submissions")
    .select("image_path")
    .eq("user_id", userId)
    .not("image_path", "is", null);
  const paths = ((data ?? []) as { image_path: string }[]).map((r) => r.image_path);
  if (paths.length > 0) await supabaseAdmin.storage.from(IDEA_BUCKET).remove(paths);
}
