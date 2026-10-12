import { Button, ScriptureQuote } from "@awebound/brand";
import type { ProductDetail, Release } from "@/shared";
import Link from "next/link";
import { pieceStatus, priceLabel, shopCanonical } from "@/features/catalog/query";

interface CampaignProps {
  release: Release | null;
  /** The piece the page opens on; null when the catalog can't be read or is empty. */
  piece: ProductDetail | null;
}

/**
 * The first screen: what Awebound makes, two ways into the shop, and one piece shown whole
 * beside a close-up of its print, with its name, price and Scripture. The release says once,
 * in a sentence, whether it can be ordered yet.
 */
export function Campaign({ release, piece }: CampaignProps) {
  const href = piece ? `/shop/${piece.slug}` : "/shop";
  const status = piece ? pieceStatus(piece) : undefined;
  return (
    <section className="campaign" aria-labelledby="campaign-title">
      <div className="aw-container campaign-in">
        <div className="campaign-text">
          <h1 id="campaign-title" className="campaign-title">
            <span>Bound in awe.</span> <span>Worn without shame.</span>
          </h1>
          <p className="campaign-lede">
            Awebound makes clothing rooted in Scripture and reverence for Jesus Christ. Every piece
            tells part of His story in bold art and lettering, from the storm He calmed to the tomb
            He left empty.
          </p>
          <div className="campaign-actions">
            <Button variant="primary" href={href}>
              {piece ? `View ${piece.name}` : "Visit the shop"}
            </Button>
            {release && release.pieces > 1 ? (
              <Button variant="secondary" href={shopCanonical(release.slug)}>
                See all {release.pieces} pieces
              </Button>
            ) : null}
          </div>
          {release?.status === "preview" ? (
            <p className="campaign-status">
              Ordering for {release.name} isn’t open yet. You can save pieces to your bag now and{" "}
              <a href="#updates">get an email when it opens</a>.
            </p>
          ) : null}
          {release?.status === "partial" ? (
            <p className="campaign-status">
              Some {release.name} pieces can be ordered now. The rest are still in preview, and you
              can save them to your bag.
            </p>
          ) : null}
        </div>

        {piece ? (
          <div className="campaign-figure">
            {/* The button and the name are the keyboard stops for this destination. */}
            <Link href={href} className="campaign-garment" tabIndex={-1}>
              {/* eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN */}
              <img
                src={piece.image.url}
                alt={piece.image.alt}
                width={1000}
                height={1250}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </Link>
            <div className="campaign-aside">
              <figure className="campaign-detail">
                {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py for every piece */}
                <img
                  src={`/products/${piece.slug}/detail.webp`}
                  alt={`Close-up of the ${piece.name} artwork`}
                  width={640}
                  height={800}
                  loading="eager"
                  fetchPriority="low"
                  decoding="async"
                />
                <figcaption>{piece.story.art}</figcaption>
              </figure>
              <div className="campaign-piece">
                <h2 className="aw-product-name">
                  <Link href={href}>{piece.name}</Link>
                </h2>
                <p className="campaign-facts">
                  <span>{piece.category.cut}</span>
                  <span className="campaign-price">{priceLabel(piece)}</span>
                </p>
                {status ? <p className="campaign-piece-status">{status}</p> : null}
                <ScriptureQuote
                  text={piece.scripture.text}
                  reference={piece.scripture.reference}
                  translation={piece.scripture.translation}
                  excerpt={piece.scripture.excerpt}
                  size="sm"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
