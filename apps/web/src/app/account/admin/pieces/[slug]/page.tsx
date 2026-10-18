import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { AssetActions } from "@/features/archive/admin/asset-controls";
import { AssetUploader } from "@/features/archive/admin/asset-uploader";
import { DraftEditor } from "@/features/archive/admin/draft-editor";
import { ImageReplace } from "@/features/catalog-admin/image-replace";
import {
  FourthwallForm,
  GalleryForm,
  GuidePicker,
  PlateForm,
  ProductForm,
  ShopCardForm,
  SizeGuideForm,
} from "@/features/catalog-admin/piece-forms";
import { PublishPanel } from "@/features/catalog-admin/publish-panel";
import { PIECE_STATUS } from "@/features/catalog-admin/status";

import { listAssets, previewUrls } from "@/server/archive/assets";
import { getOpenDraft, listContentVersions, rowToFields } from "@/server/archive/content";
import { suggestionFor } from "@/server/archive/suggestions";
import {
  designKeyOf,
  getPiece,
  listSizeGuides,
  pieceReadiness,
  type Check,
} from "@/server/catalog-admin/pieces";
import { db, signedImportUrl } from "@/server/catalog-admin/storage";
import type { ImportRow } from "@/server/catalog-admin/types";
import { fileContent } from "@/server/content";
import { formatPrice, type DraftFields } from "@/shared";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review a piece", robots: { index: false } };

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

function Section({
  id,
  title,
  intro,
  children,
}: {
  id?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="admin-section">
      <h2 className="aw-h2">{title}</h2>
      {intro ? <p className="field-help">{intro}</p> : null}
      {children}
    </section>
  );
}

function Picture({
  src,
  label,
  wide,
  children,
}: {
  src: string;
  label: string;
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <li>
      <a href={src} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element -- owner preview */}
        <img src={src} alt="" className={wide ? "admin-wide" : undefined} />
      </a>
      <p className="aw-small">{label}</p>
      {children}
    </li>
  );
}

function Checks({ items }: { items: Check[] }) {
  return (
    <ul className="admin-checks">
      {items.map((c) => (
        <li key={c.label} data-ok={c.ok}>
          {c.ok ? "Ready" : "Missing"}: {c.label}
          {c.note ? ` (${c.note})` : ""}
        </li>
      ))}
    </ul>
  );
}

export default async function ReviewPiecePage({ params }: { params: Params }) {
  const found = await getPiece((await params).slug);
  if (!found) notFound();
  const { piece, collection } = found;
  const designKey = designKeyOf(found);
  const [guides, readiness, versions, open, assets, imported] = await Promise.all([
    listSizeGuides(),
    pieceReadiness(found),
    listContentVersions(designKey),
    getOpenDraft(designKey),
    listAssets(designKey),
    piece.import_id
      ? db().from("piece_imports").select("*").eq("id", piece.import_id).maybeSingle()
      : null,
  ]);
  const importRow = (imported?.data as ImportRow | null) ?? null;
  const liveAssets = assets.filter((a) => a.status !== "retired");
  const [previews, refs] = await Promise.all([
    previewUrls(liveAssets).catch(() => ({}) as Record<string, string>),
    Promise.all(
      Object.entries(importRow?.ref_paths ?? {}).map(
        async ([name, path]) => [name, await signedImportUrl(path)] as const,
      ),
    ),
  ]);
  const ref = Object.fromEntries(refs.filter((r): r is [string, string] => Boolean(r[1])));
  const guide = guides.find((g) => g.id === piece.size_guide_id) ?? null;
  const sizes = guide ? guide.rows.map((r) => r.size) : [];
  const published = versions.find((v) => v.status === "published") ?? null;
  const working = open ?? published;
  const product = readiness.live;
  const price = (size: string) => piece.size_price_cents[size] ?? piece.price_cents;
  const priceGaps = product
    ? product.variants.flatMap((v) => {
        const size = v.attributes.size?.name ?? "One size";
        const theirs = Math.round(v.unitPrice.value * 100);
        return theirs !== price(size)
          ? [`${size}: Fourthwall ${formatPrice(theirs)}, the zip ${formatPrice(price(size))}`]
          : [];
      })
    : [];
  const key = piece.updated_at;

  return (
    <>
      <PageHeader
        title={piece.name}
        note={`${PIECE_STATUS[piece.status]}. In ${collection.name} (${collection.status}).`}
      />
      <div className="admin-inline">
        <Link className="aw-btn aw-btn-secondary" href={`/preview/${piece.slug}`} target="_blank">
          Preview as customer
        </Link>
        <Link href="#publish">Approve and publish</Link>
        <Link href={`/account/admin/collections/${collection.slug}`}>The collection</Link>
      </div>

      <Section
        title="Shop card"
        intro="The tile in the shop, on the home page’s wall and in search."
      >
        <ul className="admin-gallery">
          {piece.images.slice(0, 2).map((img, i) => (
            <Picture key={img.url} src={img.url} label={i === 0 ? "Listing image" : "Hover image"}>
              <ImageReplace
                target={{ kind: "piece", slug: piece.slug, slot: "gallery", index: i }}
              />
            </Picture>
          ))}
        </ul>
        <p className="aw-small">
          Collection: {collection.name}. It is part of the piece’s Archive record, so it stays as
          imported.
        </p>
        <ShopCardForm
          key={key}
          slug={piece.slug}
          name={piece.name}
          priceCents={piece.price_cents}
          featured={piece.featured}
        />
      </Section>

      <Section
        title="Product page"
        intro="The gallery in order, then everything beside and below it."
      >
        <GalleryForm
          key={piece.images.map((i) => i.url).join()}
          slug={piece.slug}
          images={piece.images}
        />
        <ProductForm
          key={`${key}-product`}
          slug={piece.slug}
          code={piece.code}
          category={piece.category}
          categories={fileContent.categories}
          colors={piece.colors}
          sizes={sizes}
          sizePriceCents={piece.size_price_cents}
          scripture={piece.scripture}
          story={piece.story}
        />
        <h3 className="aw-h3">Size guide</h3>
        <GuidePicker
          key={`${key}-guide`}
          slug={piece.slug}
          current={piece.size_guide_id}
          guides={guides.map((g) => ({ id: g.id, name: g.name }))}
        />
        {guide ? (
          <>
            <p className="field-help">
              Shared by every piece on the same blank: saving changes them all.
            </p>
            <SizeGuideForm
              key={`${guide.id}-${JSON.stringify(guide.rows)}`}
              id={guide.id}
              guide={{
                name: guide.name,
                blank: guide.blank,
                fit: guide.fit,
                note: guide.note,
                tolerance: guide.tolerance,
                measures: guide.measures,
                rows: guide.rows,
              }}
            />
            <ul className="admin-gallery">
              {guide.image ? <Picture src={guide.image.url} label="Size guide image" /> : null}
              <li>
                <ImageReplace
                  target={{ kind: "guide", id: guide.id }}
                  label={guide.image ? "Replace the guide image" : "Add the guide image"}
                />
              </li>
            </ul>
          </>
        ) : null}
      </Section>

      <Section
        title="Home and plates"
        intro="The opening plate and the design story: the plate, the garment cut out, and the close-up."
      >
        <PlateForm key={`${key}-plate`} slug={piece.slug} plate={piece.plate} />
        <ul className="admin-gallery">
          {(
            [
              ["piece", "Garment cut out (piece.webp)"],
              ["plateWide", "Plate, wide"],
              ["plateTall", "Plate, tall"],
              ["detail", "Close-up of the print"],
            ] as const
          ).map(([slot, label]) => (
            <Picture key={slot} src={piece.media[slot]} label={label} wide={slot === "plateWide"}>
              <ImageReplace target={{ kind: "piece", slug: piece.slug, slot }} />
            </Picture>
          ))}
        </ul>
      </Section>

      <Section
        id="archive"
        title="My Archive"
        intro="The public preview, biblical context, imagery meaning, design story, founder note and share copy."
      >
        <DraftEditor
          designKey={designKey}
          initial={working ? rowToFields(working) : EMPTY}
          openStatus={open ? (open.status === "approved" ? "approved" : "draft") : null}
          hasPublished={Boolean(published)}
          suggestion={suggestionFor(designKey, working ? rowToFields(working) : null)}
        />
      </Section>

      <Section title="Wallpapers" intro="What an owner downloads: one phone and one desktop file.">
        {(["phone", "desktop"] as const).map((format) => {
          const mine = liveAssets.filter((a) => a.format === format);
          return (
            <div key={format} className="admin-editor">
              <h3 className="aw-h3">{format === "phone" ? "Phone" : "Desktop"}</h3>
              {mine.length === 0 ? <p className="aw-body">None yet.</p> : null}
              {mine.map((a) => (
                <div key={a.id} className="admin-file">
                  {previews[a.id] ? (
                    <a
                      className="admin-file-preview"
                      href={previews[a.id]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- a signed link to the private file */}
                      <img src={previews[a.id]} alt="" />
                    </a>
                  ) : null}
                  <div>
                    <p className="aw-small">
                      {a.width} x {a.height},{" "}
                      {a.status === "published" ? "published" : "not published"}
                    </p>
                    <AssetActions assetId={a.id} publishable={a.status === "uploaded"} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        <AssetUploader designs={[{ key: designKey, name: piece.name }]} />
      </Section>

      <Section
        title="Fourthwall"
        intro="The product in the shop, matched by offer id, then by slug. Prices, stock and checkout come from here once it is public."
      >
        <FourthwallForm
          key={`${key}-fourthwall`}
          slug={piece.slug}
          fourthwallSlug={piece.fourthwall_slug}
          offerId={piece.fourthwall_offer_id}
        />
        {product ? (
          <>
            <p className="aw-body">
              {product.slug}, {product.state.type}, {product.access?.type ?? "PUBLIC"}
            </p>
            {priceGaps.length ? (
              <ul className="admin-list">
                {priceGaps.map((g) => (
                  <li key={g} className="aw-form-error">
                    Price differs: {g}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="admin-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Variant</th>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <code className="admin-code">{v.id}</code>
                      </td>
                      <td>{v.attributes.color?.name ?? "–"}</td>
                      <td>{v.attributes.size?.name ?? "–"}</td>
                      <td>{formatPrice(Math.round(v.unitPrice.value * 100))}</td>
                      <td>
                        {v.stock.type === "UNLIMITED" ? "Unlimited" : String(v.stock.inStock ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="admin-gallery">
              {product.images.slice(0, 4).map((img, i) => (
                <Picture
                  key={img.url}
                  src={img.transformedUrl || img.url}
                  label={`Fourthwall photo ${i + 1}`}
                />
              ))}
            </ul>
          </>
        ) : (
          <p className="aw-body">
            No Fourthwall product matches yet. The site shows nothing from Fourthwall until this
            piece is published here.
          </p>
        )}
        {Object.keys(ref).some((n) => n.startsWith("fourthwall-images/")) ? (
          <>
            <h3 className="aw-h3">Fourthwall images from the zip, for reference</h3>
            <ul className="admin-gallery">
              {Object.entries(ref)
                .filter(([n]) => n.startsWith("fourthwall-images/"))
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([name, url]) => (
                  <Picture key={name} src={url} label={name} />
                ))}
            </ul>
          </>
        ) : null}
      </Section>

      {ref["site-preview.pdf"] ? (
        <Section
          title="Site preview"
          intro="site-preview.pdf from the zip, for reference. It isn’t published anywhere."
        >
          <p>
            <a href={ref["site-preview.pdf"]} target="_blank" rel="noreferrer">
              Open the PDF
            </a>
          </p>
          <iframe className="admin-pdf" src={ref["site-preview.pdf"]} title="Site preview" />
        </Section>
      ) : null}

      <Section id="publish" title="Approve and publish">
        <h3 className="aw-h3">Required</h3>
        <Checks items={readiness.required} />
        <h3 className="aw-h3">Worth having</h3>
        <Checks items={readiness.warned} />
        <p className="aw-body">
          {collection.status === "published"
            ? "Its collection is live, so approving puts the piece on the site at once: shop, product page, release, home, search, My Archive, the design card, the sitemap and IndexNow."
            : "Its collection is a draft: approving holds the piece, and it goes live when you publish the collection."}
        </p>
        <PublishPanel
          slug={piece.slug}
          status={piece.status}
          collectionLive={collection.status === "published"}
          ready={readiness.ready}
        />
      </Section>
    </>
  );
}
