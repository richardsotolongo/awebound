"use client";

import { BrandLinkProvider, type LinkProps } from "@awebound/brand";
import { MotionConfig } from "motion/react";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useBag } from "@/features/bag/bag-store";

function NextLink({ href, ...rest }: LinkProps) {
  return <Link href={href} {...rest} />;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useBag.persist.rehydrate();
  }, []);

  return (
    <BrandLinkProvider link={NextLink}>
      {/* Honors the visitor's reduced-motion setting for every Motion animation. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </BrandLinkProvider>
  );
}
