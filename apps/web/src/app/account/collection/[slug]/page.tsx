import { Button, Plate, ScriptureQuote } from "@awebound/brand";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ExportControls } from "@/features/archive/export-controls";
import { siteUrl } from "@/lib/env";
import { getOwnedCard, getPublishedPublicCard } from "@/server/archive/content";
import { getProduct } from "@/server/catalog";
import { currentUser } from "@/server/session";
import { ProductSlugSchema, plateCss, type PublicCard } from "@/shared";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const card = await getPublishedPublicCard(slug).catch(() => null);
  return { title: card ? `${card.name} in your Archive` : "Your collection" };
}

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null;

function Locked({ card }: { card: PublicCard }) {
  return (
    <>
      <PageHeader title={card.name} intro={card.publicPreview} />
      <div className="archive-section">
        <h2 className="aw-h3">The passage in context</h2>
        <p className="aw-body">{card.biblicalContext}</p>
        {card.contextReference ? (
          <p className="aw-small">
            <a href={card.bibleUrl || undefined} rel="noopener">
              Read {card.contextReference} (NIV)
            </a>
          </p>
        ) : null}
        <p className="aw-body">Own this design to unlock its full story and founder note.</p>
        <div className="aw-btn-row">
          <Button variant="secondary" href={`/shop/${card.slug}`}>
            View the piece
          </Button>
        </div>
      </div>
    </>
  );
}

export default async function OwnedCardPage({ params }: { params: Params }) {
  const user = await currentUser();
  const { slug } = await params;
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/account/collection/${slug}`)}`);
  if (!ProductSlugSchema.safeParse(slug).success) notFound();
  const [card, product] = await Promise.all([getOwnedCard(user.id, slug), getProduct(slug).catch(() => null)]);
  if (!card) {
    const open = await getPublishedPublicCard(slug);
    if (!open) notFound();
    return <Locked card={open} />;
  }
  const files = `/products/${slug}`;
  const isCap = product?.category.slug === "hats";
  const views = isCap ? (product?.images ?? []).slice(0, 3) : [];
  const links = [card.bibleUrl, ...card.additionalBibleUrls].filter(Boolean);

  return (
    <div className="archive-story">
      <PageHeader title={card.name} note={`${card.collection.name}. ${product?.category.cut ?? ""}`.trim()} />

      {product?.plate ? (
        <Plate as="div" color={plateCss(product.plate)} ink={product.plate.ink} tall={`${files}/plate-tall.webp`} wide={`${files}/plate-wide.webp`} className="archive-story-head">
          {isCap ? (
            <div className="archive-story-views">
              {views.map((v) => (
                // eslint-disable-next-line @next/next/no-img-element -- site image
                <img key={v.url} src={v.url} alt={v.alt} />
              ))}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- site image
            <img src={`${files}/piece.webp`} alt={product.image.alt} width={960} height={1200} />
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
        {card.contextReference ? (
          <p className="aw-small">
            {links.length > 0 ? (
              <a href={links[0]} rel="noopener">
                Read {card.contextReference} (NIV)
              </a>
            ) : (
              <>Read {card.contextReference}.</>
            )}
          </p>
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

      <section className="archive-section" aria-labelledby="care-title">
        <h2 id="care-title" className="aw-h2">
          Care
        </h2>
        <p className="aw-body">
          {card.care.status === "verified"
            ? card.care.instructions
            : "Care instructions for this piece haven’t been confirmed yet."}
        </p>
      </section>

      {card.extras.length > 0 ? (
        <section className="archive-section" aria-labelledby="wallpapers-title">
          <h2 id="wallpapers-title" className="aw-h2">
            Wallpapers
          </h2>
          <ul className="archive-panel-list">
            {card.extras.map((x) =>
              x.status === "published" ? (
                <li key={x.format}>
                  <a href={`/api/archive/assets/${x.id}`} className="aw-btn aw-btn-secondary">
                    Download the {x.format} wallpaper ({x.width} x {x.height})
                  </a>
                </li>
              ) : (
                <li key={x.format} className="aw-body">
                  {x.format === "phone" ? "Phone" : "Desktop"}: your wallpaper is being prepared. It will appear here when published.
                </li>
              ),
            )}
          </ul>
        </section>
      ) : null}

      <section className="archive-section" aria-labelledby="share-title">
        <h2 id="share-title" className="aw-h2">
          Downloads and sharing
        </h2>
        <ExportControls slug={slug} name={card.name} shareCopy={card.shareCopy} exports={card.exports} siteUrl={siteUrl} />
      </section>
    </div>
  );
}
