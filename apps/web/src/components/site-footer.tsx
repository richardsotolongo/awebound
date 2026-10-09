"use client";

import { Footer } from "@awebound/brand";
import { api } from "@/lib/api";
import { FOOTER_NAV, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <Footer
      links={FOOTER_NAV}
      tagline={SITE.tagline}
      onSubscribe={async (email) => {
        await api.subscribe({ email, source: "footer" });
      }}
    />
  );
}
