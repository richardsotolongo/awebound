import { ScriptureRef } from "@awebound/brand";
import { FitName } from "@/components/fit-name";
import { JsonLd } from "@/components/json-ld";
import { NotifyForm } from "@/features/bag/notify-form";
import { EMPTY_LIST, shopCanonical } from "@/features/catalog/query";
import { ArchiveIntro } from "@/features/home/archive-intro";
import { Campaign } from "@/features/home/campaign";
import { Founder } from "@/features/home/founder";
import type { HeroSlide } from "@/features/home/hero-rotator";
import { LeadPiece } from "@/features/home/lead-piece";
import { ReleaseWall } from "@/features/release/release-wall";
import { siteUrl } from "@/lib/env";
import { SITE, pageMeta } from "@/lib/site";
import { getEntitlement } from "@/server/archive/entitlements";
import { getArchiveOffer, getArchivePreview } from "@/server/archive/offer";
import { getLatestRelease, getProduct, searchProducts, withFallback } from "@/server/catalog";
import { sessionUserId } from "@/server/session";
import { plateCss } from "@/shared";

export const metadata = pageMeta({ path: "/" });

// Rendered per visit so each one opens on a different piece; the catalog is still cached for a
// minute (server/fourthwall.ts).
export const dynamic = "force-dynamic";

const pickStart = (count: number) => Math.floor(Math.random() * count);

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
 * The home page, in order: the tagline and the ways into the shop on the pieces' plates, taking
 * turns from a random one, that piece up close, Richard's note, the latest release as a wall of its
 * pieces, My Archive with a preview of one design's card, and the optional sign-up for release
 * updates.
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
  const start = pickStart(slides.length);
  // The page opens on a random piece with a plate; without plates, on the first featured piece.
  const lead =
    pieces.find((p) => p.slug === slides[start]?.slug) ??
    pieces.find((p) => p.featured) ??
    pieces[0];
  const [piece, offer, preview, userId] = await Promise.all([
    lead ? withFallback(() => getProduct(lead.slug), null) : null,
    getArchiveOffer(),
    getArchivePreview(),
    sessionUserId(),
  ]);
  const previewPlate =
    pieces.find((p) => p.slug === preview?.slug)?.plate ??
    (preview ? (await withFallback(() => getProduct(preview.slug), null))?.plate : null);
  // A member who owns the previewed design reads that it is open, not that it opens with a purchase.
  const ownsPreview =
    userId && preview
      ? Boolean(await withFallback(() => getEntitlement(userId, preview.designKey), null))
      : false;

  const updates = {
    title: "Hear about the next release",
    body: "Leave your email and we’ll tell you when the next release is ready.",
  };

  return (
    <>
      <Campaign release={release} piece={piece} slides={slides} start={start} />
      <LeadPiece piece={piece} />

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
        preview={preview}
        plate={previewPlate ? plateCss(previewPlate) : null}
        signedIn={Boolean(userId)}
        owned={ownsPreview}
      />

      <section id="updates" className="updates" aria-labelledby="updates-title">
        <div className="aw-container updates-in">
          <div>
            <h2 id="updates-title" className="aw-h1">
              {updates.title}
            </h2>
            <p className="aw-body">{updates.body}</p>
          </div>
          <NotifyForm source="footer" label="Your email" />
        </div>
      </section>

      <JsonLd data={STORE} />
    </>
  );
}
