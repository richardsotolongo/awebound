import { Plate } from "@awebound/brand";
import { plateCss, type ProductDetail } from "@/shared";

/**
 * The design story: the piece's call as lettering on its own plate beside a close-up of the
 * print, then what the art shows and what it means, on coal. A piece without a plate sets the
 * same on coal.
 */
export function StoryBand({ product }: { product: ProductDetail }) {
  const { story, plate, slug, name } = product;
  const files = `/products/${slug}`;
  const inner = (
    <div className="story-in">
      <div className="story-letter">
        <h2 id="design-title" className="aw-poster story-call">
          {story.call}
        </h2>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py for every piece */}
      <img
        className="story-detail"
        src={`${files}/detail.webp`}
        alt={`Close-up of the ${name} artwork`}
        width={640}
        height={800}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
  return (
    <section className="story" aria-labelledby="design-title">
      {plate ? (
        <Plate
          as="div"
          color={plateCss(plate)}
          ink={plate.ink}
          tall={`${files}/plate-tall.webp`}
          wide={`${files}/plate-wide.webp`}
        >
          {inner}
        </Plate>
      ) : (
        inner
      )}
      <div className="aw-container story-words">
        <p className="story-art">{story.art}</p>
        <p className="aw-body">{story.meaning}</p>
      </div>
    </section>
  );
}
