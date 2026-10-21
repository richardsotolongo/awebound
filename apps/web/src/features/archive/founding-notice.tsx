"use client";

import { Button, ThornCross } from "@awebound/brand";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { usePath } from "@/lib/pathname";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getFoundingMarkAction } from "@/server/archive-actions";
import { foundingNotice } from "./offer";

/** The accounts this browser has told about their seal, newest first (named on the Privacy page). */
const KEY = "awebound-founding-seen";

function seen(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function markSeen(userId: string) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify([userId, ...seen().filter((x) => x !== userId)].slice(0, 5)),
    );
  } catch {}
}

/**
 * Under the header, once per browser: a signed-in account now holds a Founding Member seal.
 * Fourthwall's checkout never sends the buyer back, so the browser asks on each visit (and on
 * coming back to the tab) until the seal is there. It sits in the page, never a popup, and the
 * Founding tab itself counts as being told.
 */
export function FoundingNotice() {
  const path = usePath();
  const [seal, setSeal] = useState<"founding" | "honorary" | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    let live = true;
    let userId: string | null = null;
    let asked = 0;
    const check = () => {
      const id = userId;
      if (!id || seen().includes(id) || Date.now() - asked < 30_000) return;
      asked = Date.now();
      getFoundingMarkAction()
        .then((r) => {
          if (!live || !r.ok || !r.data || id !== userId) return;
          markSeen(id);
          setSeal(r.data);
        })
        .catch(() => undefined);
    };
    // Fires once with the current session, then on every sign-in or sign-out.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      userId = session?.user.id ?? null;
      // Outside the auth callback, which must not wait on other requests.
      if (userId) setTimeout(check);
      else setSeal(null);
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

  useEffect(() => {
    if (seal) track("founding_notice_shown", { seal });
  }, [seal]);

  // On the Founding tab the seal is already in view (adjusting state during render, not in an effect).
  if (seal && path.startsWith("/account/founding")) setSeal(null);
  if (!seal) return null;
  const note = foundingNotice(seal === "honorary");
  return (
    <section className="guest-order founding-notice" aria-labelledby="founding-notice-title">
      <div className="aw-container">
        <div className="archive-welcome">
          <div className="founding-notice-words">
            <span className="archive-welcome-founding-mark">
              <ThornCross size="small" height={36} title="" />
            </span>
            <div className="archive-welcome-words" role="status">
              <p id="founding-notice-title" className="aw-h3">
                {note.title}
              </p>
              <p className="aw-body">{note.body}</p>
            </div>
          </div>
          <div className="archive-welcome-actions">
            <Button
              variant="secondary"
              href="/account/founding"
              onClick={() => track("founding_notice_answered", { answer: "see" })}
            >
              See your seal
            </Button>
            <Button
              variant="link"
              onClick={() => {
                track("founding_notice_answered", { answer: "close" });
                setSeal(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
