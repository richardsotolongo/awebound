import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { EMPTY_LIST } from "@/features/catalog/query";
import { GUIDES, GUIDES_PATH, guideHref } from "@/features/guides/guides";
import { ReleaseWall } from "@/features/release/release-wall";
import { DELIVERY } from "@/lib/delivery";
import { siteUrl } from "@/lib/env";
import { SITE, pageMeta } from "@/lib/site";
import { searchProducts, withFallback } from "@/server/catalog";
import { pieceHref } from "@/shared";

export const metadata = pageMeta({
  path: GUIDES_PATH,
  title: "Christian apparel",
  description:
    "Awebound makes Christian apparel rooted in Scripture. Every tee, hoodie and cap tells part of the story of Jesus Christ in bold art and lettering.",
});

export const revalidate = 60;

/**
 * The guides' hub: what Awebound makes, a link to every guide and every piece. Unlisted like
 * the guides (features/guides/guides.ts): nothing in the site's navigation links here.
 */
export default async function ChristianApparel() {
  const { items: pieces } = await withFallback(() => searchProducts({ pageSize: 48 }), EMPTY_LIST);
  const url = `${siteUrl}${GUIDES_PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    url,
    name: "Christian apparel",
    description: SITE.description,
    isPartOf: { "@type": "WebSite", name: SITE.name, url: siteUrl },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: pieces.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: `${siteUrl}${pieceHref(p.slug)}`,
      })),
    },
  };
  const { productionTime, shippingTime } = DELIVERY;

  return (
    <div className="aw-container guide">
      <PageHeader
        title="Christian apparel"
        intro={
          <p>
            Awebound makes clothing rooted in Scripture and reverence for Jesus Christ. Every piece
            tells part of His story in bold art and lettering, from the storm He calmed to the tomb
            He left empty.
          </p>
        }
      />

      <section className="guide-section" aria-labelledby="guides-title">
        <h2 id="guides-title" className="aw-h2">
          Guides
        </h2>
        <ul className="guide-index">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <h3 className="aw-h3">
                <Link href={guideHref(g.slug)}>{g.heading}</Link>
              </h3>
              <p className="aw-body">{g.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {pieces.length > 0 ? (
        <section className="guide-section" aria-labelledby="pieces-title">
          <h2 id="pieces-title" className="aw-h2">
            Every piece
          </h2>
          <ReleaseWall pieces={pieces} label="Every Awebound piece" />
        </section>
      ) : null}

      <section className="guide-section guide-prose" aria-labelledby="about-title">
        <h2 id="about-title" className="aw-h2">
          About Awebound
        </h2>
        <p className="aw-body">
          Awebound was started by Richard, who wants to serve Christ and others through clothing
          rooted in Scripture. <Link href="/about">Read his story</Link>.
        </p>
        {productionTime && shippingTime ? (
          <p className="aw-body">
            Every piece is made to order. Production takes {productionTime}, then shipping takes{" "}
            {shippingTime}. You can check out as a guest.
          </p>
        ) : null}
        <p className="aw-body">
          The <Link href="/refunds">returns and refunds policy</Link> and the{" "}
          <Link href="/faq">FAQ</Link> answer most questions about ordering. Anything else goes to{" "}
          <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
        </p>
      </section>

      <JsonLd data={jsonLd} />
    </div>
  );
}
