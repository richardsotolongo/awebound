import { z } from "zod";

const flag = z
  .string()
  .optional()
  .transform((v) => v === "1" || v === "true");

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    WEB_ORIGIN: z
      .string()
      .default("http://localhost:3000")
      .transform((v) =>
        v
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean),
      ),
    PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
    TRUST_PROXY: flag,

    // Fourthwall supplies the catalog and runs checkout. The storefront token is its API
    // credential (Fourthwall admin → Settings → For developers); nothing works without it.
    FOURTHWALL_STOREFRONT_TOKEN: optional.pipe(
      z.string({
        error:
          "FOURTHWALL_STOREFRONT_TOKEN is required (Fourthwall admin → Settings → For developers)",
      }),
    ),
    /** Domain of the shop's hosted checkout. Override once a custom domain is connected in Fourthwall. */
    FOURTHWALL_CHECKOUT_DOMAIN: optional.transform(
      (v) => v ?? "awebound-store-shop.fourthwall.com",
    ),

    SUPABASE_URL: optional.pipe(z.url().optional()),
    SUPABASE_SECRET_KEY: optional,
    SUPABASE_JWT_SECRET: optional,

    RESEND_API_KEY: optional,
    EMAIL_FROM: z.string().default("Awebound <hello@awebound.store>"),
    CONTACT_INBOX: z.email().default("contact@awebound.store"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required in production",
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid API environment:\n${details}`);
  }
  return parsed.data;
}
