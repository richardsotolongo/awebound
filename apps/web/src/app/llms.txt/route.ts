import { EMPTY_FACETS, EMPTY_LIST, shopCanonical } from "@/features/catalog/query";
import { DELIVERY } from "@/lib/delivery";
import { siteUrl } from "@/lib/env";
import { SITE } from "@/lib/site";
import { getFacets, getProduct, getReleases, searchProducts, withFallback } from "@/server/catalog";
import { ALL_COLLECTIONS, formatPrice } from "@/shared";

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
    "> Awebound makes Christian apparel rooted in Scripture and reverence for Jesus Christ, for people who aren’t ashamed of their faith.",
    "",
    `- Its line is “${SITE.tagline}”`,
    "- Every design starts with one passage of Scripture and tells part of the story of Jesus Christ. The full reference is printed on every design.",
    "- The art uses symbols: a cross, a crown of thorns, lilies, the rolled-away stone, the Lamb. Out of reverence, it never shows Jesus, God the Father or the Holy Spirit as a person.",
    "- Awebound was started by Richard, a Florida native and a Christian.",
    "- Every piece is made to order. Each release opens for ordering after a short preview. During a preview you can save pieces to your bag and leave your email to hear when ordering opens; nothing is ordered or charged. No account is needed to order.",
    `- A misprinted, damaged or wrong item reported within ${DELIVERY.problemWindowDays} days of delivery is replaced or refunded. Made-to-order pieces can’t be returned for size or a change of mind.`,
    `- Contact: ${SITE.contactEmail}`,
    "",
    ...releases.flatMap((r) => [
      `## Release ${r.number}: ${r.name}`,
      "",
      `${r.tagline} ${r.story}`,
      "",
      `Scripture: ${r.scriptureRef}. ${r.status === "preview" ? "In preview: ordering isn’t open yet." : "Open for ordering."}`,
      "",
      ...pieces
        .filter((p) => p.collection.slug === r.slug)
        .sort((a, b) => a.position - b.position)
        .map((p) =>
          link(
            p.name,
            `/shop/${p.slug}`,
            `${p.category.cut}${p.preview ? "" : `, ${formatPrice(p.priceCents, p.currency)}`}. ${p.scripture.reference}. ${p.story.art}`,
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
    "## About",
    "",
    link(
      "Our story",
      "/about",
      "who started Awebound, what the name means and how a design is made",
    ),
    link("FAQ", "/faq", "ordering, sizing, shipping, refunds and the designs"),
    link("Contact", "/contact", "questions, and wholesale or church orders"),
    "",
    "## Optional",
    "",
    link("Refund policy", "/refunds"),
    link("Privacy policy", "/privacy"),
    link("Terms of service", "/terms"),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
