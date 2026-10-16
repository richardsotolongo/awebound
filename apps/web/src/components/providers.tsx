"use client";

import { BrandLinkProvider, type LinkProps } from "@awebound/brand";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useBag } from "@/features/bag/bag-store";
import { identify } from "@/lib/analytics";
import { getBrowserSupabase } from "@/lib/supabase/browser";

function NextLink({ href, ...rest }: LinkProps) {
  return <Link href={href} {...rest} />;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useBag.persist.rehydrate();
  }, []);

  useEffect(() => {
    // Fires once with the current session, then on every sign-in or sign-out.
    const auth = getBrowserSupabase()?.auth.onAuthStateChange((_event, session) =>
      identify(session?.user.id),
    );
    return () => auth?.data.subscription.unsubscribe();
  }, []);

  return <BrandLinkProvider link={NextLink}>{children}</BrandLinkProvider>;
}
