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
  // The first launch is one release, so the old collection pages point at the shop.
  async redirects() {
    return [
      { source: "/collections", destination: "/shop", permanent: true },
      { source: "/collections/:slug", destination: "/shop", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default config;
