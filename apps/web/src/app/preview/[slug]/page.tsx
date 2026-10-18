import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Campaign } from "@/features/home/campaign";
import { ProductView } from "@/features/product/product-view";
import { ReleaseCard } from "@/features/release/release-card";
import { getDraftPublicCard } from "@/server/archive/content";
import { getArchiveOffer } from "@/server/archive/offer";
import { getDraftCatalog } from "@/server/catalog";
import { toSummary } from "@/server/catalog-search";
import { currentUser, hasRole } from "@/server/session";
import { ProductQuerySchema } from "@/shared";

// The owner's look at a piece before it is published, built from the drafts like the shop builds
// a piece: the home page's opening plate, the shop card and the product page. Nobody else can
// open it, and search engines are asked to leave it out.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

type Params = Promise<{ slug: string }>;

export default async function PreviewPage({ params }: { params: Params }) {
  const user = await currentUser();
  if (!user || !(await hasRole(user, "admin"))) notFound();
  const { slug } = await params;
  const catalog = await getDraftCatalog();
  const product = catalog.findBySlug(slug);
  if (!product) notFound();
  const release = catalog.search(
    ProductQuerySchema.parse({ collection: [product.collection.slug], pageSize: 48 }),
  );
  const pieces = [...release.items].sort((a, b) => a.position - b.position);
  const [card, offer] = await Promise.all([getDraftPublicCard(slug), getArchiveOffer()]);

  return (
    <>
      <p className="aw-container admin-preview-note">
        A preview of {product.name} as a customer would see it. Only owners can open this page.
      </p>
      <Campaign release={null} piece={product} slides={[]} start={0} />
      <section className="aw-container" aria-label="The shop card">
        <ul className="product-grid">
          <li>
            <ReleaseCard product={toSummary(product)} nameOnLeave />
          </li>
        </ul>
      </section>
      <ProductView product={product} pieces={pieces} card={card} offer={offer} />
    </>
  );
}
