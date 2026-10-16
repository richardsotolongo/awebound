import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AssetActions, AssignAssetForm } from "@/features/archive/admin/asset-controls";
import { AssetUploader } from "@/features/archive/admin/asset-uploader";
import { when } from "@/features/archive/admin/format";
import { listAssets, previewUrls } from "@/server/archive/assets";
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

/** A file in use elsewhere under another design or format: the same bytes uploaded twice. */
type Twins = Map<string, { id: string; label: string }[]>;

function FileLine({ asset, preview, twins }: { asset: AssetRow; preview?: string; twins: Twins }) {
  const warn = orientation(asset);
  const same = (twins.get(asset.sha256) ?? []).filter((t) => t.id !== asset.id).map((t) => t.label);
  return (
    <div className="admin-file">
      {preview ? (
        <a href={preview} target="_blank" rel="noreferrer" className="admin-file-preview">
          {/* eslint-disable-next-line @next/next/no-img-element -- a signed link to the private file */}
          <img
            src={preview}
            alt={`${asset.title}, ${asset.width} x ${asset.height}`}
            loading="lazy"
          />
        </a>
      ) : null}
      <div>
        <p className="aw-small">
          {asset.title}: {asset.width} x {asset.height}, {asset.bytes.toLocaleString("en-US")}{" "}
          bytes, {asset.mime}
          {asset.mime === "image/jpeg" ? " (not a PNG master)" : ""},{" "}
          <code className="admin-code" title={asset.sha256}>
            {asset.sha256.slice(0, 8)}
          </code>
        </p>
        {warn ? <p className="field-help">{warn}</p> : null}
        {same.length > 0 ? (
          <p className="aw-form-error">
            The same file is also used for {same.join(" and ")}. Check it shows this design.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default async function AssetsPage() {
  const [designs, assets] = await Promise.all([listDesigns(), listAssets()]);
  const live = assets.filter((a) => a.status !== "retired");
  const previews = await previewUrls(live).catch(() => ({}) as Record<string, string>);
  const names = new Map(designs.map((d) => [d.design_key, d.name]));
  const twins: Twins = new Map();
  for (const a of live) {
    const label = `${a.design_key ? (names.get(a.design_key) ?? a.design_key) : "Unassigned"} (${a.format})`;
    twins.set(a.sha256, [...(twins.get(a.sha256) ?? []), { id: a.id, label }]);
  }
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
                            <FileLine
                              asset={published}
                              preview={previews[published.id]}
                              twins={twins}
                            />
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
                                <FileLine asset={a} preview={previews[a.id]} twins={twins} />
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
                      <FileLine asset={a} preview={previews[a.id]} twins={twins} />
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
