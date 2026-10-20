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

// New pieces' and size guides' images are served from the public product-images bucket.
const storage = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const config: NextConfig = {
  // Internal workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ["@awebound/brand"],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: storage
      ? [
          {
            protocol: storage.protocol === "http:" ? "http" : "https",
            hostname: storage.hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  // Files read from disk at runtime, which tracing can't see: the email wordmark (server/email.ts)
  // and the export fonts (server/archive/fonts.ts). Ship them with every server function.
  outputFileTracingIncludes: {
    "/**": [
      "./public/email/wordmark-oxblood.png",
      "./node_modules/@fontsource/grenze-gotisch/files/grenze-gotisch-latin-600-normal.woff",
      "./node_modules/@fontsource/manrope/files/manrope-latin-{400,700}-normal.woff",
      "./node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff",
    ],
  },
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
