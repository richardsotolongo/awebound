import { Button, Plate } from "@awebound/brand";
import { plateCss, pieceHref, type ProductDetail, type Release } from "@/shared";
import Link from "next/link";
import { shopCanonical } from "@/features/catalog/query";
import { HeroRotator, type HeroSlide } from "./hero-rotator";

interface CampaignProps {
  release: Release | null;
  /** The piece the page opens on; null when the catalog can't be read or is empty. */
  piece: ProductDetail | null;
  /** The release's pieces with a plate, and the one this visit starts on. */
  slides: HeroSlide[];
  start: number;
}

/**
 * The first screen: the tagline at poster size and two ways into the shop, set on a piece's own
 * plate with the garment cut out beside them. With two or more plates the pieces take turns
 * (`HeroRotator`); without a plate (or a piece) the words stand on coal.
 */
export function Campaign({ release, piece, slides, start }: CampaignProps) {
  const all =
    release && release.pieces > 1
      ? { href: shopCanonical(release.slug), label: `See all ${release.pieces} pieces` }
      : null;
  if (slides.length > 1) return <HeroRotator slides={slides} start={start} all={all} />;

  const href = piece ? pieceHref(piece.slug) : "/shop";
  const words = (
    <div className="campaign-text">
      <h1 id="campaign-title" className="aw-poster campaign-title">
        <span>Bound in awe.</span> <span>Worn without</span> <span>shame.</span>
      </h1>
      <div className="campaign-actions">
        <Button variant="primary" href={href}>
          {piece ? `View ${piece.name}` : "Visit the shop"}
        </Button>
        {all ? (
          <Button variant="secondary" href={all.href}>
            {all.label}
          </Button>
        ) : null}
      </div>
    </div>
  );

  if (!piece?.plate) {
    return (
      <section className="campaign" aria-labelledby="campaign-title">
        <div className="campaign-in">
          {words}
          {piece ? (
            <Link href={href} className="campaign-garment campaign-framed" tabIndex={-1}>
              {/* eslint-disable-next-line @next/next/no-img-element -- catalog images may come from a provider CDN */}
              <img
                src={piece.image.url}
                alt={piece.image.alt}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  const files = `/products/${piece.slug}`;
  return (
    <Plate
      className="campaign"
      color={plateCss(piece.plate)}
      ink={piece.plate.ink}
      tall={`${files}/plate-tall.webp`}
      wide={`${files}/plate-wide.webp`}
      priority
      aria-labelledby="campaign-title"
    >
      <div className="campaign-in">
        {words}
        {/* The button is the keyboard stop for this destination. */}
        <Link href={href} className="campaign-garment" tabIndex={-1}>
          {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py for every piece */}
          <img
            src={`${files}/piece.webp`}
            alt={piece.image.alt}
            width={960}
            height={1200}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </Link>
      </div>
    </Plate>
  );
}
