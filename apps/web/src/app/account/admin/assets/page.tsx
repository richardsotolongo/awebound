import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AssetActions, AssignAssetForm } from "@/features/archive/admin/asset-controls";
import { AssetUploader } from "@/features/archive/admin/asset-uploader";
import { when } from "@/features/archive/admin/format";
import { listAssets } from "@/server/archive/assets";
import { listDesigns } from "@/server/archive/designs";
import type { AssetRow } from "@/server/archive/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Assets", robots: { index: false } };

const FORMATS = ["phone", "desktop"] as const;

const orientation = (a: AssetRow) =>
  a.format === "phone" && a.width > a.height
    ? "Wider than tall: check it is the phone file."
    : a.format === "desktop" && a.height > a.width
      ? "Taller than wide: check it is the desktop file."
      : null;

function FileLine({ asset }: { asset: AssetRow }) {
  const warn = orientation(asset);
  return (
    <div>
      <p className="aw-small">
        {asset.title}: {asset.width} x {asset.height}, {asset.bytes.toLocaleString("en-US")} bytes,{" "}
        {asset.mime}
        {asset.mime === "image/jpeg" ? " (not a PNG master)" : ""},{" "}
        <code className="admin-code" title={asset.sha256}>
          {asset.sha256.slice(0, 8)}
        </code>
      </p>
      {warn ? <p className="field-help">{warn}</p> : null}
    </div>
  );
}

export default async function AssetsPage() {
  const [designs, assets] = await Promise.all([listDesigns(), listAssets()]);
  const options = designs.map((d) => ({ key: d.design_key, name: d.name }));
  const unassigned = assets.filter((a) => !a.design_key && a.status !== "retired");

  return (
    <>
      <PageHeader
        title="Assets"
        intro="One phone and one desktop wallpaper per design. A file goes live only when you publish it."
      />

      <section className="admin-section">
        <h2 className="aw-h3">Upload a file</h2>
        <AssetUploader designs={options} />
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Wallpapers</h2>
        <div className="admin-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Design</th>
                <th>Format</th>
                <th>Published</th>
                <th>Uploaded, not published</th>
              </tr>
            </thead>
            <tbody>
              {designs.flatMap((d) =>
                FORMATS.map((format) => {
                  const mine = assets.filter(
                    (a) => a.design_key === d.design_key && a.format === format,
                  );
                  const published = mine.find((a) => a.status === "published");
                  const waiting = mine.filter((a) => a.status === "uploaded");
                  return (
                    <tr key={`${d.design_key}-${format}`}>
                      <td>{d.name}</td>
                      <td>{format}</td>
                      <td>
                        {published ? (
                          <>
                            <FileLine asset={published} />
                            <p className="field-help">Published {when(published.published_at)}</p>
                            <AssetActions assetId={published.id} publishable={false} />
                          </>
                        ) : (
                          "Not published yet"
                        )}
                      </td>
                      <td>
                        {waiting.length > 0
                          ? waiting.map((a) => (
                              <div key={a.id}>
                                <FileLine asset={a} />
                                <AssetActions assetId={a.id} publishable />
                              </div>
                            ))
                          : "–"}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
        {designs.length === 0 ? (
          <p className="aw-body">No designs yet. Import the drafts first.</p>
        ) : null}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Unassigned</h2>
        {unassigned.length === 0 ? (
          <p className="aw-body">Nothing waiting.</p>
        ) : (
          <div className="admin-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Format</th>
                  <th>Uploaded</th>
                  <th>Assign to</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <FileLine asset={a} />
                      <AssetActions assetId={a.id} publishable={false} />
                    </td>
                    <td>{a.format}</td>
                    <td>{when(a.uploaded_at)}</td>
                    <td>
                      <AssignAssetForm assetId={a.id} designs={options} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
