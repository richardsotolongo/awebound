"use client";

import { Button, ThornCross } from "@awebound/brand";
import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/icons";
import { track } from "@/lib/analytics";

/** What the invitation names from My Archive: four of the things each design opens. */
const OPENS = [
  "The story behind the design",
  "A founder’s note from Richard",
  "Its Scripture and biblical context",
  "Phone and desktop wallpapers",
];

/**
 * Before a signed-out shopper's checkout, while Founding Member places remain: sign in or create
 * the free account first (the bag is kept), or go on as a guest. It asks once per visit, never
 * counts the places left, and the guest choice is as plain as the other (the owner's choice,
 * October 2026). On the native <dialog>, so focus stays inside and Escape continues as before.
 */
export function CheckoutInvite({
  open,
  onGuest,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onGuest: () => void;
  onClose: () => void;
  onNavigate?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start on the card itself, so no button looks pre-chosen; Tab reaches each in turn.
      body.current?.focus();
      track("checkout_invite_shown");
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="checkout-invite"
      aria-labelledby="checkout-invite-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="checkout-invite-in" ref={body} tabIndex={-1}>
        <button
          type="button"
          className="checkout-invite-close"
          aria-label="Close"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
        <h2 id="checkout-invite-title" className="checkout-invite-title">
          Check out with your free account?
        </h2>
        <div className="checkout-invite-founding">
          <span className="checkout-invite-mark">
            <ThornCross size="small" height={36} title="" />
          </span>
          <p>
            <strong>
              The first 50 buyers who check out signed in receive a Founding Member seal.
            </strong>{" "}
            Guest orders don’t qualify.
          </p>
        </div>
        <p className="aw-body checkout-invite-lead">
          Your order also goes straight into My Archive, where each design you buy opens with:
        </p>
        <ul className="collection-holds aw-body">
          {OPENS.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <div className="checkout-invite-actions">
          <Button
            variant="primary"
            href="/sign-in?next=%2Fbag"
            onClick={() => {
              track("checkout_invite_answered", { answer: "join" });
              onNavigate?.();
            }}
          >
            Sign in or create account
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              track("checkout_invite_answered", { answer: "guest" });
              onGuest();
            }}
          >
            Continue as guest
          </Button>
        </div>
        <p className="aw-small checkout-invite-fine">
          The account is free, and your bag is saved either way.
        </p>
      </div>
    </dialog>
  );
}
