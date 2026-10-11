"use client";

import type { ProductImage } from "@/shared";
import { useCallback, useEffect, useRef, useState } from "react";

/** How far the image zooms: close enough to read the print, far enough to know where you are. */
const ZOOM = 2;
/** How long a finger rests on the image before it zooms, so a quick swipe still changes images. */
const HOLD_MS = 180;
/** Movement (px) that turns a touch into a swipe instead of a zoom. */
const SWIPE_SLOP = 8;

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/**
 * The product's images in order (the first is the listing image). Thumbnails on desktop; swipe
 * with dots on phones. Hovering with a mouse, or pressing and holding with a finger, zooms into
 * the image under the pointer so the print can be seen up close; it follows the pointer and
 * zooms back out when the pointer leaves or the finger lifts.
 */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const [zooming, setZooming] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const frames = useRef<(HTMLImageElement | null)[]>([]);
  const currentRef = useRef(0);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  /** Zooms the image on screen so the point under (x, y) stays under the pointer. */
  const zoomAt = useCallback((x: number, y: number) => {
    const img = frames.current[currentRef.current];
    const frame = img?.parentElement;
    if (!img || !frame) return;
    const r = frame.getBoundingClientRect();
    img.style.transformOrigin = `${clamp((x - r.left) / r.width) * 100}% ${clamp((y - r.top) / r.height) * 100}%`;
    img.style.transform = `scale(${ZOOM})`;
  }, []);

  const zoomOut = useCallback(() => {
    frames.current.forEach((img) => img?.style.removeProperty("transform"));
    setZooming(false);
  }, []);

  // Touch: press and hold to zoom, then drag to look around; lift to zoom out. Native listeners,
  // because the move handler must be able to stop the swipe while zoomed.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let timer: number | undefined;
    let start: { x: number; y: number } | null = null;
    let active = false;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (e.touches.length !== 1 || !t) return;
      start = { x: t.clientX, y: t.clientY };
      timer = window.setTimeout(() => {
        if (!start) return;
        active = true;
        setZooming(true);
        zoomAt(start.x, start.y);
      }, HOLD_MS);
    };
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (active) {
        e.preventDefault();
        zoomAt(t.clientX, t.clientY);
      } else if (start && Math.hypot(t.clientX - start.x, t.clientY - start.y) > SWIPE_SLOP) {
        window.clearTimeout(timer);
        start = null;
      }
    };
    const onEnd = () => {
      window.clearTimeout(timer);
      start = null;
      if (active) {
        active = false;
        zoomOut();
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [zoomAt, zoomOut]);

  function onScroll() {
    const el = stage.current;
    if (!el || el.clientWidth === 0) return;
    setCurrent(Math.round(el.scrollLeft / el.clientWidth));
  }

  // Mouse and pen: zoom while hovering, following the pointer.
  function onPointerMove(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    if (!zooming) setZooming(true);
    zoomAt(e.clientX, e.clientY);
  }
  function onPointerLeave(e: React.PointerEvent) {
    if (e.pointerType !== "touch") zoomOut();
  }

  return (
    <div className="gallery">
      <ul className="gallery-thumbs" aria-label={`${name} views`}>
        {images.map((img, i) => (
          <li key={img.url}>
            <button
              type="button"
              aria-current={i === current}
              onClick={() => setCurrent(i)}
              aria-label={`Show image ${i + 1} of ${images.length}, ${img.view} view`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN */}
              <img src={img.url} alt="" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      <div>
        <div
          className="gallery-stage"
          ref={stage}
          onScroll={onScroll}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          data-zooming={zooming}
        >
          {images.map((img, i) => (
            <div
              key={img.url}
              className="gallery-frame"
              style={{ opacity: i === current ? 1 : 0 }}
              aria-hidden={i === current ? undefined : true}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN */}
              <img
                ref={(node) => {
                  frames.current[i] = node;
                }}
                src={img.url}
                alt={img.alt}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          ))}
        </div>
        {images.length > 1 ? (
          <div className="gallery-dots" aria-hidden="true">
            {images.map((img, i) => (
              <span key={img.url} data-on={i === current} />
            ))}
          </div>
        ) : null}
        <p className="gallery-hint aw-small" aria-hidden="true">
          <span className="gallery-hint-hover">Hover over the image to zoom in</span>
          <span className="gallery-hint-touch">Press and hold the image to zoom in</span>
        </p>
      </div>
    </div>
  );
}
