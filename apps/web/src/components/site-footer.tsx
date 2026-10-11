"use client";

import { Footer } from "@awebound/brand";
import type { ReactNode } from "react";
import { usePath } from "@/lib/pathname";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { subscribe } from "@/server/actions";

/** `notice` is the Scripture translation notice, resolved on the server. */
export function SiteFooter({ notice, children }: { notice?: string; children?: ReactNode }) {
  // The home page has its own release sign-up right above the footer.
  const home = usePath() === "/";
  return (
    <Footer
      links={FOOTER_NAV}
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
