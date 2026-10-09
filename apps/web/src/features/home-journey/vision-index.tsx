"use client";

import { useEffect, useState } from "react";
import type { Vision } from "@/lib/release";

/**
 * The I–VI rail beside the six scenes: shows where the visitor is and jumps to any piece.
 * Visible only while the scenes are on screen; hidden on small screens.
 */
export function VisionIndex({ visions, containerId }: { visions: Vision[]; containerId: string }) {
  const [active, setActive] = useState(-1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const scenes = visions
      .map((v) => document.getElementById(`vision-${v.slug}`))
      .filter((el): el is HTMLElement => el !== null);

    const onContainer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    onContainer.observe(container);

    const onScene = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    scenes.forEach((s) => onScene.observe(s));
    return () => {
      onContainer.disconnect();
      onScene.disconnect();
    };
  }, [visions, containerId]);

  function jump(slug: string) {
    const el = document.getElementById(`vision-${slug}`);
    if (!el) return;
    // Land where the scene is pinned and mostly revealed.
    const top = el.getBoundingClientRect().top + window.scrollY;
    const target = top + (el.offsetHeight - window.innerHeight) * 0.75;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: reduce ? top : target, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <nav className="vision-index" data-visible={visible} aria-label="The six pieces">
      <ol>
        {visions.map((v, i) => (
          <li key={v.slug}>
            <a
              href={`#vision-${v.slug}`}
              aria-current={i === active ? "step" : undefined}
              onClick={(e) => {
                e.preventDefault();
                jump(v.slug);
              }}
            >
              <span className="vision-index-num">{v.numeral}</span>
              <span className="vision-index-theme">{v.theme}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
