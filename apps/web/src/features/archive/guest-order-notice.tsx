"use client";

import { Button } from "@awebound/brand";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { usePath } from "@/lib/pathname";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { guestOrderAction } from "@/server/archive-actions";
import { guestOrderNote } from "./offer";

/** The cart ids this browser checked out as a guest, newest first (named on the Privacy page). */
const KEY = "awebound-guest-checkouts";

function stored(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function store(ids: string[]) {
  try {
    if (ids.length > 0) localStorage.setItem(KEY, JSON.stringify(ids.slice(0, 5)));
    else localStorage.removeItem(KEY);
  } catch {}
}

/** Called as a guest leaves for checkout, so the band can ask later whether the order arrived. */
export function rememberGuestCheckout(checkoutUrl: string) {
  const id = new URL(checkoutUrl).searchParams.get("cartId");
  if (id) store([id, ...stored().filter((x) => x !== id)]);
}

/**
 * Under the header, once a guest's order has arrived: thanks, the pieces, and what an account with
 * the checkout email opens in My Archive. Fourthwall's checkout never sends the buyer back, so the
 * browser keeps the cart ids and asks on each visit (and on coming back to the tab) until the order
 * is confirmed. Signing in or Not now ends it. It sits in the page, never a popup.
 */
export function GuestOrderNotice() {
  const path = usePath();
  const [found, setFound] = useState<{ names: string[]; waiting: string[] } | null>(null);
  const shown = useRef(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let live = true;
    let signedIn = true;
    let asked = 0;
    const check = () => {
      const ids = stored();
      if (signedIn || ids.length === 0 || Date.now() - asked < 30_000) return;
      asked = Date.now();
      guestOrderAction({ cartIds: ids })
        .then((r) => {
          if (!live || !r.ok) return;
          store([...r.data.paid, ...r.data.waiting]);
          setFound(r.data.names.length > 0 ? r.data : null);
        })
        .catch(() => undefined);
    };
    // Fires once with the current session, then on every sign-in or sign-out.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      signedIn = Boolean(session);
      if (signedIn) {
        store([]);
        setFound(null);
      } else setTimeout(check); // Outside the auth callback, which must not wait on other requests.
    });
    window.addEventListener("pageshow", check);
    window.addEventListener("focus", check);
    return () => {
      live = false;
      data.subscription.unsubscribe();
      window.removeEventListener("pageshow", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  const visible = found !== null && !path.startsWith("/sign-in");
  useEffect(() => {
    if (!found || !visible || shown.current) return;
    shown.current = true;
    track("guest_order_notice_shown", { piece_count: found.names.length });
  }, [visible, found]);

  if (!visible) return null;
  const note = guestOrderNote(found.names);
  return (
    <section className="guest-order" aria-labelledby="guest-order-title">
      <div className="aw-container">
        <div className="archive-welcome">
          <div className="archive-welcome-words" role="status">
            <p id="guest-order-title" className="aw-h3">
              {note.title}
            </p>
            <p className="aw-body">
              {note.lead} {note.site}
            </p>
          </div>
          <div className="archive-welcome-actions">
            <Button
              variant="secondary"
              href={note.cta.href}
              onClick={() => track("guest_order_notice_answered", { answer: "join" })}
            >
              {note.cta.label}
            </Button>
            <Button
              variant="link"
              onClick={() => {
                track("guest_order_notice_answered", { answer: "not_now" });
                store(found.waiting);
                setFound(null);
              }}
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
