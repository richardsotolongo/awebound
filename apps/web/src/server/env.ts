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
