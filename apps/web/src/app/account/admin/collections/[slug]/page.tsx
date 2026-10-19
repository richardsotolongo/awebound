import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CollectionForm } from "@/features/catalog-admin/collection-form";
import { CollectionPublish } from "@/features/catalog-admin/collection-publish";
import { ImageReplace } from "@/features/catalog-admin/image-replace";
import { PieceOrder } from "@/features/catalog-admin/piece-order";
import { PIECE_STATUS } from "@/features/catalog-admin/status";
import { collectionPieces, getCollection } from "@/server/catalog-admin/collections";
import { signedImportUrl } from "@/server/catalog-admin/storage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collection", robots: { index: false } };

type Params = Promise<{ slug: string }>;

export default async function CollectionPage({ params }: { params: Params }) {
  const collection = await getCollection((await params).slug);
  if (!collection) notFound();
  const [pieces, preview] = await Promise.all([
    collectionPieces(collection.id),
    signedImportUrl(collection.preview_pdf_path),
  ]);
  const waiting = pieces.filter((p) => p.status === "in_review").length;

  return (
    <>
      <PageHeader
        title={collection.name}
        note={`Release ${collection.number}, ${collection.status === "published" ? "published" : "draft"}`}
      />

      <section className="admin-section">
        <h2 className="aw-h3">Publish</h2>
        <p className="aw-body">
          {collection.status === "published"
            ? "Live on the site with its published pieces. A piece approved from now on goes live at once."
            : `Publishing puts the collection live with its ${waiting} approved piece${waiting === 1 ? "" : "s"}, and it becomes Latest Drop when it is the newest.`}
        </p>
        <CollectionPublish slug={collection.slug} published={collection.status === "published"} />
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Pieces</h2>
        {pieces.length ? (
          <PieceOrder
            collection={collection.slug}
            pieces={pieces.map((p) => ({
              slug: p.slug,
              name: p.name,
              status: PIECE_STATUS[p.status],
            }))}
          />
        ) : (
          <p className="aw-body">No pieces yet. Import a piece zip into this collection.</p>
        )}
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Details</h2>
        <CollectionForm
          slug={collection.slug}
          slugLocked={pieces.length > 0}
          initial={{
            slug: collection.slug,
            name: collection.name,
            number: collection.number,
            tagline: collection.tagline,
            story: collection.story,
            scriptureRef: collection.scripture_ref,
            releasedAt: collection.released_at ?? "",
            position: collection.position,
          }}
        />
      </section>

      <section className="admin-section">
        <h2 className="aw-h3">Cover and plate images</h2>
        <p className="field-help">Optional, and kept for the collection’s own pages.</p>
        {(["cover", "plate"] as const).map((slot) => {
          const url = slot === "cover" ? collection.cover_image : collection.plate_image;
          return (
            <div key={slot} className="admin-file">
              {url ? (
                <a className="admin-file-preview" href={url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- owner preview */}
                  <img src={url} alt="" />
                </a>
              ) : null}
              <ImageReplace
                target={{ kind: "collection", slug: collection.slug, slot }}
                label={`${slot === "cover" ? "Cover" : "Plate"} image${url ? "" : " (none yet)"}`}
              />
            </div>
          );
        })}
      </section>

      {preview ? (
        <section className="admin-section">
          <h2 className="aw-h3">Collection preview</h2>
          <p className="field-help">
            collection-preview.pdf from the release’s zip, for reference. It isn’t published
            anywhere.{" "}
            <a href={preview} target="_blank" rel="noreferrer">
              Open it
            </a>
          </p>
          <iframe className="admin-pdf" src={preview} title="Collection preview" />
        </section>
      ) : null}
    </>
  );
}
