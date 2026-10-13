import "server-only";
import { z } from "zod";

const optional = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined);

/** Server-only settings. Public ones (NEXT_PUBLIC_*) live in src/lib/env.ts. */
export const serverEnv = z
  .object({
    /** Fourthwall admin → Settings → For developers. Catalog and checkout need it. */
    FOURTHWALL_STOREFRONT_TOKEN: optional,
    FOURTHWALL_CHECKOUT_DOMAIN: optional.transform(
      (v) => v ?? "awebound-store-shop.fourthwall.com",
    ),
    SUPABASE_SECRET_KEY: optional,
    /**
     * Fourthwall admin → Settings → For developers → Webhooks: the secret that signs order events.
     * Without it the Archive can't link orders (the webhook answers 503 so Fourthwall retries later).
     */
    FOURTHWALL_WEBHOOK_SECRET: optional,
    /** Fourthwall Open API user (same page). Order sync, past-order claims and Founding settlement. */
    FOURTHWALL_API_USERNAME: optional,
    FOURTHWALL_API_PASSWORD: optional,
    /** Bearer token Vercel sends with the daily reconcile cron (any long random string). */
    CRON_SECRET: optional,
    /** Private Supabase Storage bucket holding the wallpapers. */
    ARCHIVE_STORAGE_BUCKET: optional.transform((v) => v ?? "archive-assets"),
    RESEND_API_KEY: optional,
    EMAIL_FROM: optional.transform((v) => v ?? "Awebound <noreply@awebound.store>"),
    CONTACT_INBOX: optional.transform((v) => v ?? "contact@awebound.store"),
    /**
     * Translation for Scripture quoted on the website (not the printed garments): NIV (default)
     * or KJV. Website use of the NIV needs Biblica's written permission (docs/TODOS.md).
     */
    SCRIPTURE_TRANSLATION: optional
      .transform((v) => v?.toUpperCase())
      .pipe(z.enum(["NIV", "KJV"]).catch("NIV")),
  })
  .parse(process.env);
