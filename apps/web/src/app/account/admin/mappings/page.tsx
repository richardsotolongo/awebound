import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MapOfferForm } from "@/features/archive/admin/map-offer-form";
import { listContentStatus } from "@/server/archive/content";
import { validateDraftsAgainstCatalog } from "@/server/archive/drafts";
import { fitGuideForSlug } from "@/server/archive/fit";
import { brandContent } from "@/server/content";
import { listProducts } from "@/server/fourthwall";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mappings", robots: { index: false } };

export default async function MappingsPage() {
  const [rows, live] = await Promise.all([listContentStatus(), listProducts().catch(() => null)]);
  const checks = validateDraftsAgainstCatalog();
  const check = (designKey: string) => {
    const c = checks.find((x) => x.designKey === designKey);
    return c ? c.problems.join("; ") || "ok" : "no draft";
  };
  const liveProduct = (shopSlug: string) => {
    if (!live) return "storefront token not set";
    const p = live.find((x) => x.slug === shopSlug);
    return p ? `${p.id ?? "no id"} · ${p.state.type}` : "not public yet";
  };

  return (
    <>
      <PageHeader
        title="Mappings"
        intro="How each design lines up across the catalog, the shop and the size guides."
      />
      <div className="admin-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Design</th>
              <th>Slug</th>
              <th>Code</th>
              <th>Shop slug</th>
              <th>Live product</th>
              <th>Stored offer id</th>
              <th>Size guide</th>
              <th>Care</th>
              <th>Draft check</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ design, latest }) => {
              const product = brandContent.products.find((p) => p.slug === design.product_slug);
              const guide = fitGuideForSlug(design.product_slug);
              return (
                <tr key={design.design_key}>
                  <td>{design.name}</td>
                  <td>
                    <code className="admin-code">{design.product_slug}</code>
                  </td>
                  <td>
                    <code className="admin-code">{product?.code ?? "–"}</code>
                  </td>
                  <td>
                    <code className="admin-code">{design.fourthwall_slug}</code>
                  </td>
                  <td>{liveProduct(design.fourthwall_slug)}</td>
                  <td>
                    <MapOfferForm
                      designKey={design.design_key}
                      current={design.fourthwall_offer_id}
                    />
                  </td>
                  <td>{guide ? `${guide.id}: ${guide.name}` : "none"}</td>
                  <td>{latest?.care_status ?? "–"}</td>
                  <td>{check(design.design_key)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <p className="aw-body">No designs yet. Import the drafts first.</p>
      ) : null}
    </>
  );
}
