"use client";

import { MAX_LINE_QUANTITY, type Bag, type BagLine } from "@/shared";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** What the bag shows before the API re-prices it. The API is always the source of truth. */
export type BagSnapshot = Omit<BagLine, "quantity">;

export interface BagEntry {
  sku: string;
  quantity: number;
  snapshot: BagSnapshot;
}

interface BagState {
  lines: BagEntry[];
  isOpen: boolean;
  add: (snapshot: BagSnapshot, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  /** Replace local copies with the API's priced lines; drops items that no longer exist. */
  reconcile: (bag: Bag) => void;
}

export const useBag = create<BagState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      add: (snapshot, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.sku === snapshot.sku);
          const lines = existing
            ? state.lines.map((l) =>
                l.sku === snapshot.sku
                  ? { ...l, snapshot, quantity: Math.min(l.quantity + quantity, MAX_LINE_QUANTITY) }
                  : l,
              )
            : [
                ...state.lines,
                { sku: snapshot.sku, quantity: Math.min(quantity, MAX_LINE_QUANTITY), snapshot },
              ];
          return { lines };
        }),
      setQuantity: (sku, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.sku !== sku)
              : state.lines.map((l) =>
                  l.sku === sku ? { ...l, quantity: Math.min(quantity, MAX_LINE_QUANTITY) } : l,
                ),
        })),
      remove: (sku) => set((state) => ({ lines: state.lines.filter((l) => l.sku !== sku) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      reconcile: (bag) =>
        set(() => ({
          lines: bag.lines.map(({ quantity, ...snapshot }) => ({
            sku: snapshot.sku,
            quantity,
            snapshot,
          })),
        })),
    }),
    {
      name: "awebound-bag",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      // Rehydrated after mount (see Providers) so server and first client render match.
      skipHydration: true,
    },
  ),
);

export const bagCount = (lines: BagEntry[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const bagSubtotal = (lines: BagEntry[]) =>
  lines
    .filter((l) => l.snapshot.available)
    .reduce((n, l) => n + l.quantity * l.snapshot.unitPriceCents, 0);
