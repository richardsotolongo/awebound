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

    CATALOG_SOURCE: z.enum(["seed", "supabase", "fourthwall"]).default("seed"),
    SUPABASE_URL: optional.pipe(z.url().optional()),
    SUPABASE_SECRET_KEY: optional,
    SUPABASE_JWT_SECRET: optional,

    RESEND_API_KEY: optional,
    EMAIL_FROM: z.string().default("Awebound <hello@awebound.store>"),
    CONTACT_INBOX: z.email().default("contact@awebound.store"),

    COMMERCE_PROVIDER: z
      .enum(["none", "printful", "printify", "fourthwall", "apliiq"])
      .default("none"),

    // Fourthwall Storefront API (Fourthwall admin → Settings → For Developers).
    FOURTHWALL_STOREFRONT_TOKEN: optional,
    /** Domain of the Fourthwall shop's hosted checkout, e.g. awebound-shop.fourthwall.com. */
    FOURTHWALL_CHECKOUT_DOMAIN: optional,
    FOURTHWALL_API_URL: z.url().default("https://storefront-api.fourthwall.com/v1"),
    FOURTHWALL_CURRENCY: z.string().length(3).default("USD"),
  })
  .superRefine((env, ctx) => {
    if (env.CATALOG_SOURCE === "supabase" && (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY)) {
      ctx.addIssue({
        code: "custom",
        path: ["CATALOG_SOURCE"],
        message: "CATALOG_SOURCE=supabase needs SUPABASE_URL and SUPABASE_SECRET_KEY",
      });
    }
    const usesFourthwall =
      env.CATALOG_SOURCE === "fourthwall" || env.COMMERCE_PROVIDER === "fourthwall";
    if (usesFourthwall && !env.FOURTHWALL_STOREFRONT_TOKEN) {
      ctx.addIssue({
        code: "custom",
        path: ["FOURTHWALL_STOREFRONT_TOKEN"],
        message: "Fourthwall catalog or checkout needs FOURTHWALL_STOREFRONT_TOKEN",
      });
    }
    if (env.COMMERCE_PROVIDER === "fourthwall" && !env.FOURTHWALL_CHECKOUT_DOMAIN) {
      ctx.addIssue({
        code: "custom",
        path: ["FOURTHWALL_CHECKOUT_DOMAIN"],
        message: "COMMERCE_PROVIDER=fourthwall needs FOURTHWALL_CHECKOUT_DOMAIN",
      });
    }
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
