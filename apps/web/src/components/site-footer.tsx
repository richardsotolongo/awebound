"use client";

import { Footer } from "@awebound/brand";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { subscribe } from "@/server/actions";

export function SiteFooter() {
  return (
    <Footer
      links={FOOTER_NAV}
      tagline={SITE.tagline}
      onSubscribe={async (email) => {
        const result = await subscribe({ email, source: "footer" });
        if (!result.ok) throw new Error(result.error);
      }}
    />
  );
}
