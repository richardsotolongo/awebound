import { ScriptureQuote } from "@awebound/brand";
import type { ProductDetail, Release } from "@/shared";
import Link from "next/link";
import { pieceStatus, priceLabel } from "@/features/catalog/query";

/**
 * Under the opening plate, on coal: what Awebound makes and whether the release can be ordered,
 * then the lead piece up close: its print, name, price and Scripture.
 */
export function LeadPiece({
  release,
  piece,
}: {
  release: Release | null;
  piece: ProductDetail | null;
}) {
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
          {release?.status === "preview" ? (
            <p className="lead-status">
              Ordering for {release.name} isn’t open yet. You can save pieces to your bag now and{" "}
              <a href="#updates">get an email when it opens</a>.
            </p>
          ) : null}
          {release?.status === "partial" ? (
            <p className="lead-status">
              Some {release.name} pieces can be ordered now. The rest are still in preview, and you
              can save them to your bag.
            </p>
          ) : null}
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
