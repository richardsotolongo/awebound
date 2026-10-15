"use client";

import { useEffect, type RefObject } from "react";

/** How far (px) a finger travels sideways before a lift counts as a swipe. */
const SWIPE_PX = 48;
/** Sideways movement (px) before the drag is followed at all. */
const SLOP_PX = 10;

/**
 * A finger swiped sideways across the element: `onSwipe(1)` for the next item (swiped left),
 * `onSwipe(-1)` for the previous. Vertical scrolling is left to the browser (the element needs
 * `touch-action: pan-y`), mice and pens are ignored, and the click that can follow a swipe is
 * swallowed so a link under the finger isn't followed. `onDrag` reports the sideways distance
 * while the finger moves (null when it lifts), for a little visual follow.
 */
export function useSwipe(
  ref: RefObject<HTMLElement | null>,
  onSwipe: (direction: 1 | -1) => void,
  onDrag?: (dx: number | null) => void,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number; id: number } | null = null;
    let swallow = false;

    const down = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !e.isPrimary) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      swallow = false;
    };
    const move = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      if (Math.abs(dx) > SLOP_PX && Math.abs(dx) > Math.abs(e.clientY - start.y)) onDrag?.(dx);
    };
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      onDrag?.(null);
      if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > 1.5 * Math.abs(dy)) {
        swallow = true;
        onSwipe(dx < 0 ? 1 : -1);
      }
    };
    const cancel = () => {
      start = null;
      onDrag?.(null);
    };
    const click = (e: MouseEvent) => {
      if (!swallow) return;
      swallow = false;
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", cancel);
    el.addEventListener("click", click, true);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
      el.removeEventListener("click", click, true);
    };
  }, [ref, onSwipe, onDrag]);
}
