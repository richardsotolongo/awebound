"use client";

import { Button } from "@awebound/brand";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { designAccessAction } from "@/server/archive-actions";

type Access = "unknown" | "signed-out" | "member" | "owner";

/**
 * Under the buying controls, below Add to bag: what buying this piece opens in My Archive, with one
 * quiet link. Product pages are cached for everyone, so the shopper's state is asked after mount:
 * signed out, a link to create the free Archive; a member, a link to open it; an owner of the
 * design, a link straight to its card in place of the explanation.
 */
export function ProductArchiveNote({
  slug,
  title,
  body,
  owned,
}: {
  slug: string;
  title: string;
  body: string[];
  /** Shown to an owner of the design in place of `body`. */
  owned: string;
}) {
  const [access, setAccess] = useState<Access>("unknown");

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let live = true;
    let last: boolean | null = null;
    // Fires once with the current session, then on every sign-in or sign-out.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const signedIn = Boolean(session);
      if (signedIn === last) return;
      last = signedIn;
      if (!signedIn) {
        setAccess("signed-out");
        return;
      }
      // Outside the auth callback, which must not wait on other requests.
      setTimeout(() => {
        void designAccessAction({ slug })
          .then((r) => live && setAccess(r.ok && r.data.owned ? "owner" : "member"))
          .catch(() => live && setAccess("member"));
      });
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, [slug]);

  const owner = access === "owner";
  return (
    <section className="buy-archive" aria-labelledby="buy-archive-title">
      <h2 id="buy-archive-title" className="buy-archive-title">
        {title}
      </h2>
      {(owner ? [owned] : body).map((p) => (
        <p key={p} className="aw-small">
          {p}
        </p>
      ))}
      {owner ? (
        <Button variant="link" href={`/account/collection/${slug}`}>
          View this piece in My Archive
        </Button>
      ) : access === "signed-out" ? (
        <Button variant="link" href={`/sign-in?next=${encodeURIComponent(`/shop/${slug}`)}`}>
          Create your free Archive
        </Button>
      ) : access === "member" ? (
        <Button variant="link" href="/account">
          Open My Archive
        </Button>
      ) : null}
    </section>
  );
}
