"use client";

import type { ProductImage } from "@/shared";
import { useRef, useState } from "react";

/** Back print first, then front and details. Thumbnails on desktop; swipe with dots on phones. */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const stage = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = stage.current;
    if (!el || el.clientWidth === 0) return;
    setCurrent(Math.round(el.scrollLeft / el.clientWidth));
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
              aria-label={`Show ${img.view} view`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN */}
              <img src={img.url} alt="" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      <div>
        <div className="gallery-stage" ref={stage} onScroll={onScroll}>
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN
            <img
              key={img.url}
              src={img.url}
              alt={img.alt}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              style={{ opacity: i === current ? 1 : 0 }}
              aria-hidden={i === current ? undefined : true}
            />
          ))}
        </div>
        {images.length > 1 ? (
          <div className="gallery-dots" aria-hidden="true">
            {images.map((img, i) => (
              <span key={img.url} data-on={i === current} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
