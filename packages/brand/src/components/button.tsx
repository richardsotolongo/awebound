"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../cx";
import { BrandLink } from "../link";

export type ButtonVariant = "primary" | "secondary" | "link" | "on-feature" | "on-altar";

interface CommonProps {
  /** One primary per screen. */
  variant?: ButtonVariant;
  /** Stretch to the container width. */
  block?: boolean;
  className?: string;
  children?: ReactNode;
}

type AsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = AsButton | AsLink;

/** Buttons for actions. Labels are sentence case in code; styling sets caps. Never "Buy now". */
export function Button(props: ButtonProps) {
  const { variant = "primary", block, className, children } = props;
  const cls = cx("aw-btn", `aw-btn-${variant}`, block && "aw-btn-block", className);

  if (props.href !== undefined) {
    const { variant: _v, block: _b, className: _c, children: _ch, ...anchor } = props;
    return (
      <BrandLink {...anchor} className={cls}>
        {children}
      </BrandLink>
    );
  }

  const { variant: _v, block: _b, className: _c, children: _ch, type, ...button } = props;
  return (
    <button type={type ?? "button"} {...button} className={cls}>
      {children}
    </button>
  );
}
