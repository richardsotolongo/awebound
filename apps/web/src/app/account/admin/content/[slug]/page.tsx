import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CareForm } from "@/features/archive/admin/care-form";
import { DraftEditor } from "@/features/archive/admin/draft-editor";
import { when } from "@/features/archive/admin/format";
import { getOpenDraft, listContentVersions } from "@/server/archive/content";
import { listDesigns } from "@/server/archive/designs";
import type { ContentRow } from "@/server/archive/types";
import { listProducts } from "@/server/fourthwall";
import type { DraftFields } from "@/shared";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Content", robots: { index: false } };

type Params = Promise<{ slug: string }>;

const EMPTY: DraftFields = {
  publicPreview: "",
  biblicalContext: "",
  contextReference: "",
  bibleUrl: "",
  additionalBibleUrls: [],
  designStory: "",
  imageryMeaning: "",
  founderNote: "",
  shareCopy: "",
  notes: "",
};

const toFields = (row: ContentRow): DraftFields => ({
  publicPreview: row.public_preview,
  biblicalContext: row.biblical_context,
  contextReference: row.context_reference,
  bibleUrl: row.bible_url,
  additionalBibleUrls: row.additional_bible_urls,
  designStory: row.design_story,
  imageryMeaning: row.imagery_meaning,
  founderNote: row.founder_note,
  shareCopy: row.share_copy,
  notes: row.notes ?? "",
});

function Copy({ items }: { items: [string, string][] }) {
  return (
    <dl className="admin-copy">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v || "–"}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ContentDesignPage({ params }: { params: Params }) {
  const { slug } = await params;
  const design = (await listDesigns()).find((d) => d.product_slug === slug);
  if (!design) notFound();
  const [versions, open, live] = await Promise.all([
    listContentVersions(design.design_key),
    getOpenDraft(design.design_key),
    listProducts().catch(() => null),
  ]);
  const published = versions.find((v) => v.status === "published") ?? null;
  const working = open ?? published;
  const providerDescription = live?.find((p) => p.slug === design.fourthwall_slug)?.description?.replace(/<[^>]+>/g, " ").trim() || null;
  const care =
    working?.care_status === "verified"
      ? `Verified from ${working.care_source ?? "an unnamed source"} on ${when(working.care_verified_at)}.`
      : "Unconfirmed.";

  return (
    <>
      <PageHeader title={design.name} note={`${design.scripture_reference} · ${design.product_slug}`} />

      <section className="admin-section">
        <h2 className="aw-h3">Draft</h2>
        <p className="aw-small">
          {open
            ? `Open version ${open.version}, ${open.status}.`
            : published
              ? "Nothing open. Saving starts a new version from the published one."
              : "No draft yet."}
        </p>
        <DraftEditor
          designKey={design.design_key}
          initial={working ? toFields(working) : EMPTY}
          openStatus={open ? (open.status === "approved" ? "approved" : "draft") : null}
          hasPublished={Boolean(published)}
        />
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Care</h2>
        <p className="aw-body">{care}</p>
        <CareForm designKey={design.design_key} initialInstructions={working?.care_instructions ?? ""} initialSource={working?.care_source ?? ""} />
        {providerDescription ? (
          <>
            <h3 className="aw-h3">Provider description</h3>
            <p className="aw-small">{providerDescription}</p>
          </>
        ) : null}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">What the public sees</h2>
        {published ? (
          <Copy
            items={[
              ["Public preview", published.public_preview],
              ["Biblical context", published.biblical_context],
              ["Context reference", published.context_reference],
              ["Bible URL", published.bible_url],
              ["More Bible URLs", published.additional_bible_urls.join("\n")],
            ]}
          />
        ) : (
          <p className="aw-body">Nothing is published yet.</p>
        )}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">What an owner sees</h2>
        {published ? (
          <Copy
            items={[
              ["Design story", published.design_story],
              ["Imagery meaning", published.imagery_meaning],
              ["Founder note", published.founder_note],
              ["Share copy", published.share_copy],
            ]}
          />
        ) : (
          <p className="aw-body">Nothing is published yet.</p>
        )}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Versions</h2>
        <div className="admin-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Status</th>
                <th>Created</th>
                <th>Approved</th>
                <th>Published</th>
                <th>Retired</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id}>
                  <td>{v.version}</td>
                  <td>{v.status}</td>
                  <td>{when(v.created_at)}</td>
                  <td>{when(v.approved_at)}</td>
                  <td>{when(v.published_at)}</td>
                  <td>{when(v.retired_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
