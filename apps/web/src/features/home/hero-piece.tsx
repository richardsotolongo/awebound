"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface HeroPiece {
  /** The slide on the opening plate now. */
  index: number;
  setIndex: (index: number) => void;
  /** A pointer or focus rests in the lead piece below the plate, so the plate holds still. */
  held: boolean;
  setHeld: (held: boolean) => void;
}

const HeroPieceContext = createContext<HeroPiece | null>(null);

/**
 * The piece the home page is showing, shared by the opening plate (`HeroRotator`), which moves
 * it, and the lead piece under it (`LeadPiece`), which follows it and can hold it still.
 */
export function HeroPieceProvider({ start, children }: { start: number; children: ReactNode }) {
  const [index, setIndex] = useState(start);
  const [held, setHeld] = useState(false);
  const value = useMemo(() => ({ index, setIndex, held, setHeld }), [index, held]);
  return <HeroPieceContext.Provider value={value}>{children}</HeroPieceContext.Provider>;
}

/** The shared piece, or null outside the provider. */
export const useHeroPiece = () => useContext(HeroPieceContext);
