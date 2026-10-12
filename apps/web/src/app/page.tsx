import { ScriptureRef } from "@awebound/brand";
import { FitName } from "@/components/fit-name";
import { JsonLd } from "@/components/json-ld";
import { NotifyForm } from "@/features/bag/notify-form";
import { EMPTY_LIST, shopCanonical } from "@/features/catalog/query";
import { Campaign } from "@/features/home/campaign";
import { Founder } from "@/features/home/founder";
import { LeadPiece } from "@/features/home/lead-piece";
import { ReleaseWall } from "@/features/release/release-wall";
import { siteUrl } from "@/lib/env";
import { SITE, pageMeta } from "@/lib/site";
import { getLatestRelease, getProduct, searchProducts, withFallback } from "@/server/catalog";

export const metadata = pageMeta({ path: "/" });

export const revalidate = 60;

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
 * The home page, in order: the tagline and the ways into the shop on the lead piece's plate, that
 * piece up close, Richard's note, the latest release as a wall of its pieces, and the optional
 * sign-up for release updates.
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
  // The page opens on the release's first featured piece, or simply its first.
  const lead = pieces.find((p) => p.featured) ?? pieces[0];
  const piece = lead ? await withFallback(() => getProduct(lead.slug), null) : null;

  const updates = {
    title: "Hear about the next release",
    body: "Leave your email and we’ll tell you when the next release is ready.",
  };

  return (
    <>
      <Campaign release={release} piece={piece} />
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
