"use client";

import { Footer } from "@awebound/brand";
import type { ReactNode } from "react";
import { accountsEnabled } from "@/lib/env";
import { usePath } from "@/lib/pathname";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { subscribe } from "@/server/actions";

// My Archive is listed only while accounts are on.
const LINKS = accountsEnabled ? FOOTER_NAV : FOOTER_NAV.filter((l) => l.href !== "/account");

/** `notice` is the Scripture translation notice, resolved on the server. */
export function SiteFooter({ notice, children }: { notice?: string; children?: ReactNode }) {
  // The home page has its own release sign-up right above the footer.
  const home = usePath() === "/";
  return (
    <Footer
      links={LINKS}
      tagline={SITE.tagline}
      notice={notice}
      signup={!home}
      onSubscribe={async (email) => {
        const result = await subscribe({ email, source: "footer" });
        if (!result.ok) throw new Error(result.error);
      }}
    >
      {children}
    </Footer>
  );
}
