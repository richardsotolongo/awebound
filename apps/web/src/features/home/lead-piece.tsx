import { ScriptureQuote } from "@awebound/brand";
import type { ProductDetail } from "@/shared";
import Link from "next/link";
import { pieceStatus, priceLabel } from "@/features/catalog/query";

/**
 * Under the opening plate, on coal: what Awebound makes, then the lead piece up close: its
 * print, name, price and Scripture.
 */
export function LeadPiece({ piece }: { piece: ProductDetail | null }) {
  const status = piece ? pieceStatus(piece) : undefined;
  return (
    <section className="lead">
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
              <figcaption>{piece.story.art}</figcaption>
            </figure>
            <div className="lead-facts">
              <h2 className="aw-product-name">
                <Link href={`/shop/${piece.slug}`}>{piece.name}</Link>
              </h2>
              <p className="lead-row">
                <span>{piece.category.cut}</span>
                <span className="lead-price">{priceLabel(piece)}</span>
              </p>
              {status ? <p className="lead-piece-status">{status}</p> : null}
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
