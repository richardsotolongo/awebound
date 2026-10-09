"use client";

import { Footer } from "@awebound/brand";
import { usePathname } from "next/navigation";
import { FOOTER_NAV, SITE } from "@/lib/site";
import { subscribe } from "@/server/actions";

/** `notice` is the Scripture translation notice, resolved on the server. */
export function SiteFooter({ notice }: { notice?: string }) {
  // The home page has its own release sign-up right above the footer.
  const home = usePathname() === "/";
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
    />
  );
}
