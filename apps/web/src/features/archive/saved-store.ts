"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getSavedSlugsAction, savePieceAction, unsavePieceAction } from "@/server/archive-actions";

interface SavedState {
  signedIn: boolean;
  /** The shopper's saved pieces; null until they have loaded. */
  slugs: ReadonlySet<string> | null;
  error: string;
  toggle: (slug: string) => Promise<void>;
}

const toggled = (slugs: ReadonlySet<string> | null, slug: string, on: boolean) => {
  const next = new Set(slugs ?? []);
  if (on) next.add(slug);
  else next.delete(slug);
  return next;
};

/**
 * Which pieces the signed-in shopper has saved, shared by every heart on the page: pages are
 * cached for everyone, so the list loads once in the browser after sign-in is known.
 */
export const useSaved = create<SavedState>()((set, get) => ({
  signedIn: false,
  slugs: null,
  error: "",
  toggle: async (slug) => {
    const on = !get().slugs?.has(slug);
    set({ slugs: toggled(get().slugs, slug, on), error: "" });
    const result = await (on ? savePieceAction : unsavePieceAction)({ slug }).catch(() => null);
    if (!result?.ok) {
      set({
        slugs: toggled(get().slugs, slug, !on),
        error: result?.error ?? "That didn’t work. Try again.",
      });
    }
  },
}));

let listening = false;

/** Starts following the session (once per page load) and returns the shared state. */
export function useSavedPieces() {
  useEffect(() => {
    if (listening) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    listening = true;
    supabase.auth.onAuthStateChange((_event, session) => {
      const signedIn = Boolean(session);
      if (signedIn === useSaved.getState().signedIn) return;
      useSaved.setState({ signedIn, slugs: null });
      if (!signedIn) return;
      // Outside the auth callback, which must not wait on other requests.
      setTimeout(() => {
        void getSavedSlugsAction()
          .then((r) => {
            if (r.ok && useSaved.getState().signedIn) useSaved.setState({ slugs: new Set(r.data) });
          })
          .catch(() => undefined);
      });
    });
  }, []);
  return useSaved();
}
