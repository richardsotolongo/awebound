import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const config: NextConfig = {
  // Internal workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ["@awebound/brand"],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // server/email.ts reads the wordmark to attach it inline; ship it with every server function.
  outputFileTracingIncludes: { "/**": ["./public/email/wordmark-oxblood.png"] },
  // Stage and preview deploys run the same site at their own address: keep them out of search.
  async headers() {
    const headers =
      process.env.VERCEL_ENV === "production"
        ? securityHeaders
        : [...securityHeaders, { key: "X-Robots-Tag", value: "noindex" }];
    return [{ source: "/(.*)", headers }];
  },
};

export default config;
