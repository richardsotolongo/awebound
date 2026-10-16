import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { when } from "@/features/archive/admin/format";
import { ImportDraftsButton } from "@/features/archive/admin/owner-buttons";
import { ApplySuggestions } from "@/features/archive/admin/apply-suggestions";
import { PublishApprovedButton } from "@/features/archive/admin/publish-approved-button";
import { listContentStatus } from "@/server/archive/content";
import { validateDraftsAgainstCatalog } from "@/server/archive/drafts";
import { pendingSuggestions } from "@/server/archive/suggestions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Content", robots: { index: false } };

export default async function ContentPage() {
  const [rows, pending] = await Promise.all([listContentStatus(), pendingSuggestions()]);
  const checks = validateDraftsAgainstCatalog();
  const check = (designKey: string) => {
    const c = checks.find((x) => x.designKey === designKey);
    return c ? c.problems.join("; ") || "ok" : "no draft";
  };
  const approved = rows
    .filter((r) => r.latest?.status === "approved")
    .map((r) => r.design.design_key);
  const nothingYet = rows.every((r) => !r.latest);

  return (
    <>
      <PageHeader
        title="Content"
        intro="Each design’s story moves from draft to approved to published. Approval needs the founder note read as your own words."
      />
      <ApplySuggestions pending={pending} />
      <div className="admin-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Design</th>
              <th>Version</th>
              <th>Approved</th>
              <th>Published</th>
              <th>Founder note</th>
              <th>Draft check</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ design, latest, published }) => (
              <tr key={design.design_key}>
                <td>
                  <Link href={`/account/admin/content/${design.product_slug}`}>{design.name}</Link>
                </td>
                <td>{latest ? `v${latest.version} ${latest.status}` : "none"}</td>
                <td>{when(latest?.approved_at)}</td>
                <td>{when(published?.published_at)}</td>
                <td>{latest ? (latest.founder_note_proposed ? "Proposed" : "Reviewed") : "–"}</td>
                <td>{check(design.design_key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <p className="aw-body">No designs yet. Import the drafts to create them.</p>
      ) : null}
      <div className="admin-section">
        <PublishApprovedButton designKeys={approved} />
        {nothingYet ? <ImportDraftsButton /> : null}
      </div>
    </>
  );
}
