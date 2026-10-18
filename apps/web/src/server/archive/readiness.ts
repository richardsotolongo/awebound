import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { serverEnv } from "../env";
import { getFlags } from "./flags";
import { loadFonts } from "./fonts";
import { platformConfigured } from "./fourthwall-platform";

/**
 * Per-feature readiness: what the environment, the owner's flags and the content actually allow
 * right now. Every claim the site makes about the Archive is gated by exactly one of these bits,
 * so nothing is advertised before it works.
 */
export interface ArchiveReadiness {
  database: boolean;
  orders: boolean;
  platformApi: boolean;
  claims: boolean;
  founding: boolean;
  content: boolean;
  publishedDesigns: number;
  wallpapers: boolean;
  publishedAssets: number;
  pdf: boolean;
  share: boolean;
  cron: boolean;
  fonts: boolean;
  storage: boolean;
  emails: {
    preferencesUi: boolean;
    welcome: boolean;
    unlock: boolean;
    collectionUpdates: boolean;
    guestFollowUp: boolean;
    cartReminder: boolean;
  };
  missing: string[];
}

export const getArchiveReadiness = cache(async (): Promise<ArchiveReadiness> => {
  const database = Boolean(supabaseAdmin);
  const flags = await getFlags();
  let publishedDesigns = 0;
  let publishedAssets = 0;
  let storage = false;
  if (supabaseAdmin) {
    const [designs, assets, bucket] = await Promise.all([
      supabaseAdmin
        .from("archive_designs")
        .select("design_key", { count: "exact", head: true })
        .not("published_content_id", "is", null),
      supabaseAdmin
        .from("archive_assets")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabaseAdmin.storage
        .getBucket(serverEnv.ARCHIVE_STORAGE_BUCKET)
        .catch(() => ({ data: null, error: new Error("unreachable") })),
    ]);
    publishedDesigns = designs.count ?? 0;
    publishedAssets = assets.count ?? 0;
    storage = Boolean(bucket.data) && !bucket.error;
  }
  let fonts = true;
  try {
    loadFonts();
  } catch {
    fonts = false;
  }
  const orders =
    database && Boolean(serverEnv.FOURTHWALL_WEBHOOK_SECRET) && flags["archive.orders"];
  // sendEmail prints in development without a Resend key, so claim codes still reach the terminal.
  const email = Boolean(serverEnv.RESEND_API_KEY) || process.env.NODE_ENV !== "production";
  const platformApi = platformConfigured();
  const content = publishedDesigns > 0;
  const missing: string[] = [];
  if (!database) missing.push("SUPABASE_SECRET_KEY");
  if (!serverEnv.FOURTHWALL_WEBHOOK_SECRET) missing.push("FOURTHWALL_WEBHOOK_SECRET");
  if (!platformApi) missing.push("FOURTHWALL_API_USERNAME / FOURTHWALL_API_PASSWORD");
  if (!serverEnv.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!serverEnv.CRON_SECRET) missing.push("CRON_SECRET");
  if (database && !storage) missing.push(`storage bucket ${serverEnv.ARCHIVE_STORAGE_BUCKET}`);
  if (!fonts) missing.push("export fonts");
  return {
    database,
    orders,
    platformApi,
    claims: orders && email && flags["archive.claims"],
    founding: orders && flags["archive.founding"],
    content,
    publishedDesigns,
    wallpapers: database && storage && flags["archive.wallpapers"],
    publishedAssets,
    pdf: flags["archive.pdf"] && fonts && content,
    share: flags["archive.share"] && fonts && content,
    cron: Boolean(serverEnv.CRON_SECRET),
    fonts,
    storage,
    emails: {
      preferencesUi: flags["email.preferences_ui"],
      welcome: flags["email.welcome"],
      unlock: flags["email.unlock"],
      collectionUpdates: flags["email.collection_updates"],
      guestFollowUp: flags["email.guest_follow_up"],
      cartReminder: flags["email.cart_reminder"],
    },
    missing,
  };
});
