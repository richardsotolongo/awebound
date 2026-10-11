"use client";

import { usePathname } from "next/navigation";

/**
 * The current path, the same on the server as in the browser. Vercel renders the prerendered
 * home page as "/index", so anything decided from the raw path (the footer's sign-up, the header's
 * current link and sign-in address) differed from the browser's render: a hydration error.
 */
export function usePath(): string {
  const pathname = usePathname();
  return pathname === "/index" ? "/" : pathname;
}
