import { ScriptureRef } from "@awebound/brand";
import { FitName } from "@/components/fit-name";
import { JsonLd } from "@/components/json-ld";
import { EMPTY_LIST, shopCanonical } from "@/features/catalog/query";
import { ArchiveIntro } from "@/features/home/archive-intro";
import { Campaign } from "@/features/home/campaign";
import { Founder } from "@/features/home/founder";
import { HeroPieceProvider } from "@/features/home/hero-piece";
import type { HeroSlide } from "@/features/home/hero-rotator";
import { LeadPiece } from "@/features/home/lead-piece";
import { toLeadSlide } from "@/features/home/lead-slide";
import { ReleaseWall } from "@/features/release/release-wall";
import { siteUrl } from "@/lib/env";
import { SITE, pageMeta } from "@/lib/site";
import { getEntitlement } from "@/server/archive/entitlements";
import { getArchiveOffer, getArchivePreview } from "@/server/archive/offer";
import { getLatestRelease, getProduct, searchProducts, withFallback } from "@/server/catalog";
import { sessionUserId } from "@/server/session";
import { plateCss } from "@/shared";

export const metadata = pageMeta({ path: "/" });

// Rendered per visit for the signed-in state of My Archive; the catalog is still cached for a
// minute (server/fourthwall.ts).
export const dynamic = "force-dynamic";

/** Who Awebound is, for search engines and AI assistants. Add `sameAs` once social links exist. */
const STORE = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": `${siteUrl}/#store`,
      name: SITE.name,
      url: siteUrl,
      logo: `${siteUrl}/apple-icon.png`,
      description: SITE.description,
      slogan: SITE.tagline,
      email: SITE.contactEmail,
    },
    {
      "@type": "WebSite",
      name: SITE.name,
      url: siteUrl,
      publisher: { "@id": `${siteUrl}/#store` },
    },
  ],
};

/**
 * The home page, in order: the tagline and the ways into the shop on the pieces' plates, opening
 * on the release's primary piece and then taking turns, the piece on the plate up close (it
 * follows the plate), Richard's note, the latest release as a wall of its pieces, and My Archive
 * with a preview of one design's card.
 */
export default async function Home() {
  const release = await withFallback(getLatestRelease, null);
  const list = release
    ? await withFallback(
        () => searchProducts({ collection: [release.slug], pageSize: 48 }),
        EMPTY_LIST,
      )
    : EMPTY_LIST;
  const pieces = list.items;
  const slides: HeroSlide[] = pieces.flatMap((p) =>
    p.plate
      ? [
          {
            slug: p.slug,
            name: p.name,
            alt: p.image.alt,
            plate: plateCss(p.plate),
            ink: p.plate.ink,
          },
        ]
      : [],
  );
  // Every visit opens on the release's primary piece: its first featured piece in release order
  // (Thorns to Lilies in Behold), or its first piece. The others follow in release order.
  const primary = pieces.find((p) => p.featured) ?? pieces[0];
  const start = Math.max(
    0,
    slides.findIndex((s) => s.slug === primary?.slug),
  );
  const lead = pieces.find((p) => p.slug === slides[start]?.slug) ?? primary;
  const [piece, offer, preview, userId] = await Promise.all([
    lead ? withFallback(() => getProduct(lead.slug), null) : null,
    getArchiveOffer(),
    getArchivePreview(),
    sessionUserId(),
  ]);
  // The card previewed beside My Archive: a published one, or the lead piece's public fields
  // (name, reference, what its art shows) until a design is published.
  const card =
    preview ??
    (piece
      ? {
          designKey: "",
          slug: piece.slug,
          name: piece.name,
          scriptureReference: piece.scripture.reference,
          publicPreview: piece.story.art,
          wallpapers: [],
        }
      : null);
  const previewPlate =
    pieces.find((p) => p.slug === card?.slug)?.plate ??
    (card ? (await withFallback(() => getProduct(card.slug), null))?.plate : null);
  // The lead piece follows the plate: one entry per slide, in the same order. Without slides the
  // plate stands still on the one piece.
  const rotating = slides.length > 1;
  const leads = rotating
    ? (await Promise.all(slides.map((s) => withFallback(() => getProduct(s.slug), null)))).map(
        (p) => (p ? toLeadSlide(p) : null),
      )
    : [piece ? toLeadSlide(piece) : null];
  const leadStart = rotating ? start : 0;
  // A member who owns the previewed design reads that it is open, not that it opens with a purchase.
  const ownsPreview =
    userId && card?.designKey
      ? Boolean(await withFallback(() => getEntitlement(userId, card.designKey), null))
      : false;

  return (
    <>
      <HeroPieceProvider start={leadStart}>
        <Campaign release={release} piece={piece} slides={slides} start={start} />
        <LeadPiece leads={leads} start={leadStart} />
      </HeroPieceProvider>

      <Founder />

      {release && pieces.length > 0 ? (
        <section id="pieces" className="lineup" aria-labelledby="lineup-title">
          <header className="aw-container release-head">
            <FitName id="lineup-title">{release.name}</FitName>
            <div className="release-sub">
              <p className="release-tagline">{release.tagline}</p>
              <ScriptureRef reference={release.scriptureRef} align="start" />
            </div>
          </header>
          <ReleaseWall
            pieces={pieces}
            label={`The ${release.name} pieces`}
            more={{
              href: shopCanonical(release.slug),
              label: `See all ${release.pieces} pieces`,
            }}
          />
        </section>
      ) : null}

      <ArchiveIntro
        offer={offer}
        preview={card}
        plate={previewPlate ? plateCss(previewPlate) : null}
        signedIn={Boolean(userId)}
        owned={ownsPreview}
        saved={slides.slice(0, 3).map((s) => ({ slug: s.slug, plate: s.plate }))}
      />

      <JsonLd data={STORE} />
    </>
  );
}
