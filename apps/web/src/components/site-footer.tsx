"use client";

import { Footer } from "@awebound/brand";
import type { ReactNode } from "react";
import { accountsEnabled } from "@/lib/env";
import { FOOTER_NAV, SITE } from "@/lib/site";

// My Archive is listed only while accounts are on.
const LINKS = accountsEnabled ? FOOTER_NAV : FOOTER_NAV.filter((l) => l.href !== "/account");

/**
 * `notice` is the Scripture translation notice, resolved on the server. The release-updates
 * sign-up is off for now (the owner's choice); `signup` brings it back.
 */
export function SiteFooter({ notice, children }: { notice?: string; children?: ReactNode }) {
  return (
    <Footer links={LINKS} tagline={SITE.tagline} notice={notice} signup={false}>
      {children}
    </Footer>
  );
}
