"use client";

import { useRef, type KeyboardEvent } from "react";

/**
 * Roving-tabindex keyboard support for a radiogroup made of buttons:
 * arrow keys move and select, Home/End jump, disabled options are skipped.
 */
export function useRadioGroup(options: string[], value: string | undefined, onChange: ((v: string) => void) | undefined, disabled: string[] = []) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.filter((o) => !disabled.includes(o));
  const focusTarget = value && enabled.includes(value) ? value : enabled[0];

  function move(from: string, delta: number | "home" | "end") {
    if (enabled.length === 0) return;
    let next: string | undefined;
    if (delta === "home") next = enabled[0];
    else if (delta === "end") next = enabled[enabled.length - 1];
    else {
      const i = enabled.indexOf(from);
      next = enabled[(i + delta + enabled.length) % enabled.length];
    }
    if (!next) return;
    onChange?.(next);
    refs.current[options.indexOf(next)]?.focus();
  }

  function itemProps(option: string, index: number) {
    return {
      ref: (el: HTMLButtonElement | null) => {
        refs.current[index] = el;
      },
      tabIndex: option === focusTarget ? 0 : -1,
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
        const map: Record<string, number | "home" | "end"> = {
          ArrowRight: 1,
          ArrowDown: 1,
          ArrowLeft: -1,
          ArrowUp: -1,
          Home: "home",
          End: "end",
        };
        const delta = map[e.key];
        if (delta === undefined) return;
        e.preventDefault();
        move(option, delta);
      },
    };
  }

  return { itemProps };
}
