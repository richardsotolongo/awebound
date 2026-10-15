"use client";

import { ScriptureQuote } from "@awebound/brand";
import Link from "next/link";
import { useRef, type FocusEvent } from "react";
import { useHeroPiece } from "./hero-piece";
import type { LeadSlide } from "./lead-slide";

/**
 * Under the opening plate, on coal: what Awebound makes, then the piece on the plate up close:
 * its print, name, price and Scripture. It follows the plate as the pieces take turns (`leads`
 * has one entry per slide, in order), and a pointer or focus resting here holds the plate still,
 * so the name never changes under the hand.
 */
export function LeadPiece({ leads, start }: { leads: (LeadSlide | null)[]; start: number }) {
  const shared = useHeroPiece();
  const piece = leads[shared?.index ?? start] ?? null;
  const rest = useRef({ pointer: false, focus: false });
  const hold = (change: Partial<typeof rest.current>) => {
    rest.current = { ...rest.current, ...change };
    shared?.setHeld(rest.current.pointer || rest.current.focus);
  };

  return (
    <section
      className="lead"
      onPointerEnter={() => hold({ pointer: true })}
      onPointerLeave={() => hold({ pointer: false })}
      onFocus={() => hold({ focus: true })}
      onBlur={(e: FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hold({ focus: false });
      }}
    >
      <div className="aw-container lead-in">
        <div className="lead-about">
          <p className="lead-lede">
            Awebound makes clothing rooted in Scripture and reverence for Jesus Christ. Every piece
            tells part of His story in bold art and lettering, from the storm He calmed to the tomb
            He left empty.
          </p>
        </div>

        {piece ? (
          <>
            <figure className="lead-detail">
              {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py for every piece */}
              <img
                src={`/products/${piece.slug}/detail.webp`}
                alt={`Close-up of the ${piece.name} artwork`}
                width={640}
                height={800}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{piece.art}</figcaption>
            </figure>
            <div className="lead-facts">
              <h2 className="aw-product-name">
                <Link href={`/shop/${piece.slug}`}>{piece.name}</Link>
              </h2>
              <p className="lead-row">
                <span>{piece.cut}</span>
                <span className="lead-price">{piece.price}</span>
              </p>
              {piece.status ? <p className="lead-piece-status">{piece.status}</p> : null}
              <ScriptureQuote
                text={piece.scripture.text}
                reference={piece.scripture.reference}
                translation={piece.scripture.translation}
                excerpt={piece.scripture.excerpt}
                size="md"
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
