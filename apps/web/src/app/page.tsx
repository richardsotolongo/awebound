import { ScriptureRef } from "@awebound/brand";
import { JsonLd } from "@/components/json-ld";
import { NotifyForm } from "@/features/bag/notify-form";
import { EMPTY_LIST } from "@/features/catalog/query";
import { Campaign } from "@/features/home/campaign";
import { Founder } from "@/features/home/founder";
import { ReleaseCard } from "@/features/release/release-card";
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
 * The home page, in order: one piece up close with the ways into the shop, Richard's note, every
 * piece in the latest release, and the optional sign-up for release updates.
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

  const updates =
    !release || release.status === "open"
      ? {
          title: "Hear about the next release",
          body: "Leave your email and we’ll tell you when the next release is ready.",
        }
      : release.status === "partial"
        ? {
            title: `Know when the rest of ${release.name} opens`,
            body: `Some ${release.name} pieces can be ordered now. Leave your email and we’ll tell you when the rest are available.`,
          }
        : {
            title: `Know when ${release.name} opens`,
            body: `Ordering for ${release.name} isn’t open yet. Leave your email and we’ll tell you when the pieces are available to order.`,
          };

  return (
    <>
      <Campaign release={release} piece={piece} />

      <Founder />

      {release && pieces.length > 0 ? (
        <section id="pieces" className="lineup aw-container" aria-labelledby="lineup-title">
          <header className="lineup-head">
            <h2 id="lineup-title" className="aw-h1">
              {release.name}
            </h2>
            <p className="aw-body">{release.tagline}</p>
            <ScriptureRef reference={release.scriptureRef} align="start" />
          </header>
          <ul className="product-grid lineup-grid" aria-label={`The ${release.name} pieces`}>
            {pieces.map((p) => (
              <li key={p.slug}>
                <ReleaseCard product={p} />
              </li>
            ))}
          </ul>
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
