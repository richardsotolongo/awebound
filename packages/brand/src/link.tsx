"use client";

import {
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type ComponentType,
  type ReactNode,
} from "react";

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
export type LinkComponent = ComponentType<LinkProps>;

function PlainAnchor(props: LinkProps) {
  return <a {...props} />;
}

const BrandLinkContext = createContext<LinkComponent>(PlainAnchor);

/**
 * Lets brand components render the host framework's link (for example next/link) for internal
 * hrefs. External, mailto and tel links always render a plain anchor.
 */
export function BrandLinkProvider({
  link,
  children,
}: {
  link: LinkComponent;
  children: ReactNode;
}) {
  return <BrandLinkContext.Provider value={link}>{children}</BrandLinkContext.Provider>;
}

const EXTERNAL = /^(https?:|mailto:|tel:|#)/;

export function BrandLink(props: LinkProps) {
  const Link = useContext(BrandLinkContext);
  if (EXTERNAL.test(props.href)) return <PlainAnchor {...props} />;
  return <Link {...props} />;
}
