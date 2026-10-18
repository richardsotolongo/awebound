import { ScriptureQuote, ScriptureRef } from "@awebound/brand";
import Link from "next/link";
import { Fragment } from "react";
import { SizeGuide } from "@/features/product/size-guide";
import { ReleaseCard } from "@/features/release/release-card";
import { nameWithCut, pieceHref, type ProductDetail } from "@/shared";
import { GUIDES, GUIDES_PATH, guideHref, type GuideBlock } from "./guides";

/** Pieces that share a value, in the order each value first appears. */
function groupBy(pieces: ProductDetail[], key: (p: ProductDetail) => string | null | undefined) {
  const groups = new Map<string, ProductDetail[]>();
  for (const p of pieces) {
    const k = key(p);
    if (k) groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  return [...groups];
}

/** Piece names as links, written the way the site writes a list: "A, B and C". */
function Names({ pieces }: { pieces: ProductDetail[] }) {
  return pieces.map((p, i) => (
    <Fragment key={p.slug}>
      {i === 0 ? null : i === pieces.length - 1 ? " and " : ", "}
      <Link href={pieceHref(p.slug)}>{p.name}</Link>
    </Fragment>
  ));
}

function Closeup({ piece }: { piece: ProductDetail }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- made by assets/mockups/compose.py, or imported with the piece
    <img
      className="guide-closeup"
      src={piece.media.detail}
      alt={`Close-up of the ${piece.name} artwork`}
      width={640}
      height={800}
      loading="lazy"
      decoding="async"
    />
  );
}

function Block({ block, pieces }: { block: GuideBlock; pieces: ProductDetail[] }) {
  switch (block.kind) {
    case "cards":
      return (
        <ul className="product-grid">
          {pieces.map((p, i) => (
            <li key={p.slug}>
              <ReleaseCard product={p} priority={i < 3} />
            </li>
          ))}
        </ul>
      );
    case "art":
      return (
        <section className="guide-section">
          <h2 className="aw-h2">{block.heading}</h2>
          <dl className="guide-list">
            {pieces.map((p) => (
              <div key={p.slug}>
                <dt className="aw-h3">
                  <Link href={pieceHref(p.slug)}>{p.name}</Link>
                </dt>
                <dd className="aw-body">{p.story.art}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "fabric":
      return (
        <section className="guide-section">
          <h2 className="aw-h2">{block.heading}</h2>
          <ul className="guide-list">
            {groupBy(pieces, (p) => p.story.material).map(([material, group]) => (
              <li key={material} className="aw-body">
                <Names pieces={group} />: {material.replaceAll(" · ", ", ")}
              </li>
            ))}
          </ul>
        </section>
      );
    case "fit": {
      const Title = block.heading ? "h3" : "h2";
      return (
        <section className="guide-section">
          {block.heading ? <h2 className="aw-h2">{block.heading}</h2> : null}
          {groupBy(pieces, (p) => p.sizeGuide?.name).map(([name, group]) => {
            const { sizeGuide, category } = group[0]!;
            return (
              <div key={name} className="guide-fit">
                <Title className="aw-h3">{name}</Title>
                <p className="aw-body">
                  For <Names pieces={group} />.
                </p>
                {/* The table itself, in place of the guide image the product page opens. */}
                <SizeGuide guide={{ ...sizeGuide!, image: null }} cut={category.cut} />
              </div>
            );
          })}
        </section>
      );
    }
    case "verses":
      return (
        <div className="guide-entries">
          {pieces.map((p) => (
            <article key={p.slug} className="guide-entry">
              <Closeup piece={p} />
              <div className="guide-entry-text">
                <h2 className="aw-h3">
                  <Link href={pieceHref(p.slug)}>{nameWithCut(p)}</Link>
                </h2>
                <ScriptureQuote
                  text={p.scripture.text}
                  reference={p.scripture.reference}
                  translation={p.scripture.translation}
                  excerpt={p.scripture.excerpt}
                />
                <p className="aw-body">{p.story.art}</p>
              </div>
            </article>
          ))}
        </div>
      );
    case "symbols":
      return (
        <div className="guide-entries">
          {pieces.map((p) =>
            block.labels[p.slug] ? (
              <article key={p.slug} className="guide-entry">
                <Closeup piece={p} />
                <div className="guide-entry-text">
                  <h2 className="aw-h3">{block.labels[p.slug]}</h2>
                  <ScriptureRef reference={p.scripture.reference} align="start" />
                  <p className="guide-art">{p.story.art}</p>
                  <p className="aw-body">{p.story.meaning}</p>
                  <p className="aw-body">
                    <Link href={pieceHref(p.slug)}>View {p.name}</Link>
                  </p>
                </div>
              </article>
            ) : null,
          )}
        </div>
      );
  }
}

/** A guide's body: its blocks in order, each built from the pieces it shows. */
export function GuideBlocks({ blocks, pieces }: { blocks: GuideBlock[]; pieces: ProductDetail[] }) {
  return blocks.map((block) => <Block key={block.kind} block={block} pieces={pieces} />);
}

/** The links that tie the guides together, since nothing else on the site points to them. */
export function MoreGuides({ current }: { current: string }) {
  return (
    <nav className="guide-section guide-more" aria-labelledby="more-guides">
      <h2 id="more-guides" className="aw-h2">
        More guides
      </h2>
      <ul>
        <li>
          <Link href={GUIDES_PATH}>Christian apparel</Link>
        </li>
        {GUIDES.filter((g) => g.slug !== current).map((g) => (
          <li key={g.slug}>
            <Link href={guideHref(g.slug)}>{g.heading}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
