"use client";

import { Button } from "@awebound/brand";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type FocusEvent,
} from "react";
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from "@/components/icons";
import { useSwipe } from "@/lib/use-swipe";
import { useHeroPiece } from "./hero-piece";
import { pieceHref, type Media } from "@/shared";

export interface HeroSlide {
  slug: string;
  name: string;
  alt: string;
  /** The piece's plate color as a CSS value. */
  plate: string;
  ink: "bone" | "coal";
  media: Media;
}

const ADVANCE_MS = 7000;
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The surface this screen shows, the garment and its close-up in the lead piece below, decoded
 * before a slide appears, so the plate and the lead piece change together.
 */
function preload(media: Media): Promise<unknown> {
  const wide = window.matchMedia("(min-width: 900px)").matches;
  return Promise.all(
    [wide ? media.plateWide : media.plateTall, media.piece, media.detail].map((src) => {
      const img = new Image();
      img.src = src;
      return img.decode().catch(() => undefined);
    }),
  );
}

/**
 * The opening plate, one piece at a time: it starts on the piece the server picked for this
 * visit and moves to the next every few seconds (the plate cross-fades; the garment fades out
 * before the next fades in), only while it is on screen and no pointer rests on its buttons or
 * garment or on the lead piece below, and no focus is inside them. Previous, Pause and Next sit
 * under the actions; with reduced motion it never moves on its own. On a touch screen a sideways
 * swipe across the plate moves to the next or previous piece (the garment follows the finger a
 * little while it moves). Inside `HeroPieceProvider` the piece is shared, so the lead piece
 * follows it.
 */
export function HeroRotator({
  slides,
  start,
  all,
}: {
  slides: HeroSlide[];
  start: number;
  all: { href: string; label: string } | null;
}) {
  const shared = useHeroPiece();
  const [ownIndex, setOwnIndex] = useState(start);
  const index = shared ? shared.index : ownIndex;
  const setIndex = shared ? shared.setIndex : setOwnIndex;
  // Slides whose images are in the page: the first, then each one as it is about to show.
  const [mounted, setMounted] = useState([start]);
  const [paused, setPaused] = useState(false);
  // Held while a pointer rests on the buttons or the garment, or focus is inside.
  const [pointerHeld, setPointerHeld] = useState(false);
  const [focusHeld, setFocusHeld] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
  const ref = useRef<HTMLElement>(null);
  const slide = slides[index]!;

  const go = useCallback(
    async (to: number) => {
      const next = (to + slides.length) % slides.length;
      // Mount it hidden first so the switch can fade it in.
      setMounted((m) => (m.includes(next) ? m : [...m, next]));
      await preload(slides[next]!.media);
      setIndex(next);
    },
    [slides, setIndex],
  );

  // A sideways swipe: next or previous piece. The garment follows the finger a little (never far
  // enough to leave the plate), and not at all with reduced motion.
  const swipe = useCallback((direction: 1 | -1) => void go(index + direction), [go, index]);
  const drag = useCallback(
    (dx: number | null) => {
      const el = ref.current;
      if (!el) return;
      if (dx === null || reduced) {
        el.removeAttribute("data-dragging");
        el.style.removeProperty("--drag");
        return;
      }
      el.setAttribute("data-dragging", "");
      el.style.setProperty("--drag", `${Math.max(-40, Math.min(40, dx * 0.35))}px`);
    },
    [reduced],
  );
  useSwipe(ref, swipe, drag);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(Boolean(entry?.isIntersecting)),
      { threshold: 0.5 },
    );
    observer.observe(el);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const running =
    !reduced && !paused && !pointerHeld && !focusHeld && !shared?.held && onScreen && tabVisible;
  const hold = {
    onPointerEnter: () => setPointerHeld(true),
    onPointerLeave: () => setPointerHeld(false),
  };
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => void go(index + 1), ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [running, index, go]);

  const href = pieceHref(slide.slug);
  return (
    <section
      ref={ref}
      className="aw-plate campaign campaign-rotating"
      data-ink={slide.ink}
      style={{ "--plate": slide.plate } as CSSProperties}
      aria-labelledby="campaign-title"
      onFocus={() => setFocusHeld(true)}
      onBlur={(e: FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusHeld(false);
      }}
    >
      {mounted.map((i) => {
        const s = slides[i]!;
        return (
          <picture key={s.slug} className="aw-plate-bg campaign-layer" data-on={i === index}>
            <source media="(min-width: 900px)" srcSet={s.media.plateWide} />
            <img
              src={s.media.plateTall}
              alt=""
              loading="eager"
              fetchPriority={i === start ? "high" : undefined}
              decoding="async"
            />
          </picture>
        );
      })}
      <div className="campaign-in">
        <div className="campaign-text">
          <h1 id="campaign-title" className="aw-poster campaign-title">
            <span>Bound in awe.</span> <span>Worn without</span> <span>shame.</span>
          </h1>
          <div className="campaign-actions" {...hold}>
            <Button variant="primary" href={href}>
              View {slide.name}
            </Button>
            {all ? (
              <Button variant="secondary" href={all.href}>
                {all.label}
              </Button>
            ) : null}
          </div>
          <div className="campaign-controls" role="group" aria-label="Pieces" {...hold}>
            <button
              type="button"
              className="campaign-control"
              aria-label="Previous piece"
              onClick={() => void go(index - 1)}
            >
              <ArrowLeftIcon size={20} />
            </button>
            {reduced ? null : (
              <button
                type="button"
                className="campaign-control"
                aria-label={paused ? "Play" : "Pause"}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
              </button>
            )}
            <button
              type="button"
              className="campaign-control"
              aria-label="Next piece"
              onClick={() => void go(index + 1)}
            >
              <ArrowRightIcon size={20} />
            </button>
          </div>
        </div>
        {/* The button is the keyboard stop for this destination. */}
        <Link href={href} className="campaign-garment" tabIndex={-1} {...hold}>
          {mounted.map((i) => {
            const s = slides[i]!;
            return (
              // eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py for every piece
              <img
                key={s.slug}
                src={s.media.piece}
                alt={i === index ? s.alt : ""}
                data-on={i === index}
                width={960}
                height={1200}
                loading="eager"
                fetchPriority={i === start ? "high" : undefined}
                decoding="async"
              />
            );
          })}
        </Link>
      </div>
    </section>
  );
}
