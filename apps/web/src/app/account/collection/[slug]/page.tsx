import { Button, Plate, ScriptureQuote } from "@awebound/brand";
import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BibleLink } from "@/features/archive/bible-link";
import { ExportControls } from "@/features/archive/export-controls";
import { siteUrl } from "@/lib/env";
import { getOwnedCard, getPublishedPublicCard } from "@/server/archive/content";
import { getProduct } from "@/server/catalog";
import { currentUser } from "@/server/session";
import {
  collectionHref,
  pieceHref,
  plateCss,
  ProductSlugSchema,
  slugAtAddress,
  type PublicCard,
} from "@/shared";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = slugAtAddress((await params).slug);
  const card = await getPublishedPublicCard(slug).catch(() => null);
  return { title: card ? `${card.name} in your Archive` : "Your collection" };
}

const date = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

function Locked({ card }: { card: PublicCard }) {
  return (
    <>
      <PageHeader title={card.name} intro={card.publicPreview} />
      <div className="archive-section">
        <h2 className="aw-h3">The passage in context</h2>
        <p className="aw-body">{card.biblicalContext}</p>
        {card.contextReference && card.bibleUrl ? (
          <BibleLink href={card.bibleUrl} reference={card.contextReference} />
        ) : null}
        <p className="aw-body">Own this design to unlock its full story and founder note.</p>
        <div className="aw-btn-row">
          <Button variant="secondary" href={pieceHref(card.slug)}>
            View the piece
          </Button>
        </div>
      </div>
    </>
  );
}

export default async function OwnedCardPage({ params }: { params: Params }) {
  const user = await currentUser();
  const { slug, moved } = slugAtAddress((await params).slug);
  if (moved) permanentRedirect(collectionHref(slug));
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(collectionHref(slug))}`);
  if (!ProductSlugSchema.safeParse(slug).success) notFound();
  const [card, product] = await Promise.all([
    getOwnedCard(user.id, slug),
    getProduct(slug).catch(() => null),
  ]);
  if (!card) {
    const open = await getPublishedPublicCard(slug);
    if (!open) notFound();
    return <Locked card={open} />;
  }
  const isCap = product?.category.slug === "hats";
  const views = isCap ? (product?.images ?? []).slice(0, 3) : [];
  const links = [card.bibleUrl, ...card.additionalBibleUrls].filter(Boolean);
  const wallpapers = card.extras.flatMap((x) => (x.status === "published" ? [x] : []));

  return (
    <div className="archive-story">
      <PageHeader
        title={card.name}
        note={`${card.collection.name}. ${product?.category.cut ?? ""}`.trim()}
      />

      {product?.plate ? (
        <Plate
          as="div"
          color={plateCss(product.plate)}
          ink={product.plate.ink}
          tall={product.media.plateTall}
          wide={product.media.plateWide}
          className="archive-story-head"
        >
          {isCap ? (
            <div className="archive-story-views">
              {views.map((v) => (
                // eslint-disable-next-line @next/next/no-img-element -- site image
                <img key={v.url} src={v.url} alt={v.alt} />
              ))}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- site image
            <img
              className="archive-story-piece"
              src={product.media.piece}
              alt={product.image.alt}
              width={960}
              height={1200}
            />
          )}
        </Plate>
      ) : null}

      {product ? (
        <ScriptureQuote
          text={product.scripture.text}
          reference={product.scripture.reference}
          translation={product.scripture.translation}
          excerpt={product.scripture.excerpt}
          size="lg"
        />
      ) : null}

      <section className="archive-section" aria-labelledby="context-title">
        <h2 id="context-title" className="aw-h2">
          The passage in context
        </h2>
        <p className="aw-body">{card.biblicalContext}</p>
        {card.contextReference && links[0] ? (
          <BibleLink href={links[0]} reference={card.contextReference} />
        ) : null}
      </section>

      <section className="archive-section" aria-labelledby="design-title">
        <h2 id="design-title" className="aw-h2">
          The design
        </h2>
        <p className="aw-body">{card.designStory}</p>
      </section>

      <section className="archive-section" aria-labelledby="imagery-title">
        <h2 id="imagery-title" className="aw-h2">
          The imagery
        </h2>
        <p className="aw-body">{card.imageryMeaning}</p>
      </section>

      <section data-theme="light" className="archive-note" aria-labelledby="note-title">
        <div className="archive-note-in">
          <h2 id="note-title" className="aw-h2">
            A note from Richard
          </h2>
          <p className="aw-body">{card.founderNote}</p>
          <p className="aw-small">Richard, founder of Awebound</p>
        </div>
      </section>

      <section className="archive-section" aria-labelledby="pieces-title">
        <h2 id="pieces-title" className="aw-h2">
          Your pieces
        </h2>
        <dl className="spec">
          {card.entitlement.variants.map((v, i) => (
            <div key={i} style={{ display: "contents" }}>
              <dt>{[v.color, v.size].filter(Boolean).join(", ") || "Piece"}</dt>
              <dd>{v.quantity === 1 ? "1 piece" : `${v.quantity} pieces`}</dd>
            </div>
          ))}
          {card.entitlement.firstPaidAt ? (
            <div style={{ display: "contents" }}>
              <dt>First purchased</dt>
              <dd>{date(card.entitlement.firstPaidAt)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {wallpapers.length > 0 ? (
        <section className="archive-section" aria-labelledby="wallpapers-title">
          <h2 id="wallpapers-title" className="aw-h2">
            Wallpapers
          </h2>
          <ul className="archive-panel-list">
            {wallpapers.map((x) => (
              <li key={x.format}>
                <a href={`/api/archive/assets/${x.id}`} className="aw-btn aw-btn-secondary">
                  Download the {x.format} wallpaper ({x.width} x {x.height})
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="archive-section" aria-labelledby="share-title">
        <h2 id="share-title" className="aw-h2">
          Downloads and sharing
        </h2>
        <ExportControls
          slug={slug}
          name={card.name}
          shareCopy={card.shareCopy}
          exports={card.exports}
          siteUrl={siteUrl}
        />
      </section>
    </div>
  );
}
