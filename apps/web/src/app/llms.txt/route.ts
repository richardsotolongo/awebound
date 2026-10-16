import { EMPTY_FACETS, EMPTY_LIST, priceLabel, shopCanonical } from "@/features/catalog/query";
import { GUIDES, GUIDES_PATH, guideHref } from "@/features/guides/guides";
import { DELIVERY } from "@/lib/delivery";
import { siteUrl } from "@/lib/env";
import { SITE } from "@/lib/site";
import { getFacets, getProduct, getReleases, searchProducts, withFallback } from "@/server/catalog";
import { ALL_COLLECTIONS, pieceHref } from "@/shared";

export const revalidate = 3600;

/**
 * /llms.txt (llmstxt.org): the brand and its pieces in plain Markdown for AI assistants, built
 * from the catalog so a new release appears by itself. Scripture is given by reference only, and
 * a price only once a piece can be ordered.
 */
export async function GET() {
  const [releases, facets, list] = await Promise.all([
    withFallback(getReleases, []),
    withFallback(() => getFacets({}), EMPTY_FACETS),
    withFallback(() => searchProducts({ pageSize: 48 }), EMPTY_LIST),
  ]);
  const pieces = (
    await Promise.all(list.items.map((p) => withFallback(() => getProduct(p.slug), null)))
  ).filter((p) => p !== null);
  const link = (label: string, path: string, note = "") =>
    `- [${label}](${siteUrl}${path})${note && `: ${note}`}`;

  const lines = [
    `# ${SITE.name}`,
    "",
    "> Awebound makes Christian apparel rooted in Scripture and reverence for Jesus Christ.",
    "",
    "- Everyone is welcome, whether they come for the artwork, the meaning behind it or simply to learn more.",
    `- Its line is “${SITE.tagline}”`,
    "- Every design starts with one passage of Scripture and tells part of the story of Jesus Christ. The full reference is printed on every design.",
    "- The art uses symbols: a cross, a crown of thorns, lilies, the rolled-away stone, the Lamb. Out of reverence, it never shows Jesus, God the Father or the Holy Spirit as a person.",
    "- Awebound was started by Richard, who wants to serve Christ and others through clothing rooted in Scripture.",
    `- Every piece is made to order: production takes ${DELIVERY.productionTime}, then shipping takes ${DELIVERY.shippingTime}. No account is needed to order; checkout works as a guest.`,
    `- A damaged, misprinted or defective piece, or the wrong item or size sent, reported within ${DELIVERY.problemWindowDays} days of delivery with a photo is replaced at no cost, or refunded if a replacement isn’t possible. Made-to-order pieces can’t be returned or exchanged for a size the customer chose or a change of mind. Customers in the EU, UK and EEA keep their legal 14-day right of withdrawal.`,
    `- Contact: ${SITE.contactEmail}`,
    "",
    ...releases.flatMap((r) => [
      `## Release ${r.number}: ${r.name}`,
      "",
      `${r.tagline} ${r.story}`,
      "",
      `Scripture: ${r.scriptureRef}.`,
      "",
      ...pieces
        .filter((p) => p.collection.slug === r.slug)
        .sort((a, b) => a.position - b.position)
        .map((p) =>
          link(
            p.name,
            pieceHref(p.slug),
            `${p.category.cut}, ${priceLabel(p)}. ${p.scripture.reference}. ${p.story.art}`,
          ),
        ),
      "",
    ]),
    "## Categories",
    "",
    ...facets.categories
      .filter((c) => c.count > 0)
      .map((c) => link(c.name, shopCanonical(ALL_COLLECTIONS, c.slug))),
    "",
    "## Guides",
    "",
    link("Christian apparel", GUIDES_PATH, "what Awebound makes, with every guide and piece"),
    ...GUIDES.map((g) => link(g.heading, guideHref(g.slug), g.description)),
    "",
    "## About",
    "",
    link(
      "Our story",
      "/about",
      "who started Awebound, what the name means and how a design is made",
    ),
    link("FAQ", "/faq", "ordering, sizing, shipping, returns and the designs"),
    link("Contact", "/contact", "questions, and wholesale or church orders"),
    "",
    "## Optional",
    "",
    link("Returns and refunds", "/refunds"),
    link("Privacy policy", "/privacy"),
    link("Terms of service", "/terms"),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
