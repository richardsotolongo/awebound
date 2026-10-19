import { ScriptureQuote } from "@awebound/brand";
import Link from "next/link";
import { ViewTransition } from "react";
import { DesignContext } from "@/features/archive/design-context";
import { productNote, type ArchiveOffer } from "@/features/archive/offer";
import { ProductArchiveNote } from "@/features/archive/product-archive-note";
import { shopCanonical } from "@/features/catalog/query";
import { ReleaseWall } from "@/features/release/release-wall";
import { plateCss, type ProductDetail, type ProductSummary, type PublicCard } from "@/shared";
import { PieceNav } from "./piece-nav";
import { ProductGallery } from "./product-gallery";
import { ProductPurchase } from "./product-purchase";
import { StoryBand } from "./story-band";

/** Moving between neighbouring pieces: the page slides in from the side it lies on. */
const SLIDE = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

/**
 * A product page: the stage and the buy column, the design story, its Archive card, the details,
 * the neighbouring pieces and the rest of the release. The shop renders it, and so does the
 * owner's preview of a draft.
 */
export function ProductView({
  product,
  pieces,
  card,
  offer,
}: {
  product: ProductDetail;
  /** The release's pieces in order. */
  pieces: ProductSummary[];
  /** Only the published public fields of the Archive card (the open draft in a preview). */
  card: PublicCard | null;
  offer: ArchiveOffer;
}) {
  const at = pieces.findIndex((p) => p.slug === product.slug);
  const prev = at > 0 ? pieces[at - 1] : undefined;
  const next = at >= 0 && at < pieces.length - 1 ? pieces[at + 1] : undefined;
  const others = pieces.filter((p) => p.slug !== product.slug);
  const { scripture, story } = product;
  // What buying the piece opens in My Archive, shown wherever accounts are open.
  const note = offer.accounts ? productNote(product.name) : null;

  return (
    <ViewTransition key={product.slug} enter={SLIDE} exit={SLIDE} default="none">
      <div className="pdp-page">
        <div className="pdp">
          <ProductGallery
            images={product.images}
            name={product.name}
            slug={product.slug}
            plate={plateCss(product.plate)}
          />

          <div className="buy">
            <nav aria-label="Breadcrumb" className="aw-small crumbs">
              <Link href="/shop">Shop</Link>
              <span aria-hidden="true"> / </span>
              <Link href={shopCanonical(product.collection.slug)}>{product.collection.name}</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{product.name}</span>
            </nav>
            <h1 className="buy-name">{product.name}</h1>
            <ProductPurchase product={product}>
              <ScriptureQuote
                text={scripture.text}
                reference={scripture.reference}
                translation={scripture.translation}
                excerpt={scripture.excerpt}
                size="md"
              />
            </ProductPurchase>
            {note ? <ProductArchiveNote slug={product.slug} {...note} /> : null}
          </div>
        </div>

        <StoryBand product={product} />
        {card ? <DesignContext card={card} opens={offer.accounts} /> : null}

        <section className="aw-container details" aria-labelledby="details-title">
          <h2 id="details-title" className="aw-h2">
            Product details
          </h2>
          <div>
            <dl className="spec">
              <dt>Garment</dt>
              <dd>{product.category.cut}</dd>
              <dt>Fit</dt>
              <dd>{story.fit}</dd>
              <dt>{product.colors.length > 1 ? "Colors" : "Color"}</dt>
              <dd>{product.colors.map((c) => c.name).join(", ")}</dd>
              <dt>Front</dt>
              <dd>{story.front}</dd>
              <dt>Back</dt>
              <dd>{story.back}</dd>
              <dt>{story.process === "embroidered" ? "Thread" : "Inks"}</dt>
              <dd>{story.inks}</dd>
              <dt>Fabric</dt>
              <dd>{story.material ?? "Ask us for fabric details."}</dd>
            </dl>
            <p className="field-help">
              Questions about fit? <Link href="/contact">Ask us</Link>.
            </p>
          </div>
        </section>

        <PieceNav prev={prev} next={next} />

        {others.length > 0 ? (
          <section className="more" aria-labelledby="related-title">
            <h2 id="related-title" className="aw-container aw-h2">
              More from {product.collection.name}
            </h2>
            <ReleaseWall
              nameOnLeave
              pieces={others}
              label={`More ${product.collection.name} pieces`}
              more={{
                href: shopCanonical(product.collection.slug),
                label: `See all ${pieces.length} pieces`,
              }}
            />
          </section>
        ) : null}
      </div>
    </ViewTransition>
  );
}
