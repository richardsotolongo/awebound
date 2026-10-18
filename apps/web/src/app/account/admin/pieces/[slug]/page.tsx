import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { AssetActions } from "@/features/archive/admin/asset-controls";
import { AssetUploader } from "@/features/archive/admin/asset-uploader";
import { DraftEditor } from "@/features/archive/admin/draft-editor";
import { ImageReplace } from "@/features/catalog-admin/image-replace";
import { ImageTile } from "@/features/catalog-admin/image-tile";
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
type Search = Promise<{ tab?: string }>;

/** The review, one step at a time, in the order customers meet the piece. */
const TABS = [
  ["shop", "Shop card", "The tile in the shop, on the home page’s wall and in search."],
  ["product", "Product page", "The gallery in order, then the words beside and below it."],
  [
    "size",
    "Size guide",
    "The measurements behind the size buttons. Shared by every piece on the same blank.",
  ],
  [
    "home",
    "Home and plates",
    "The home page’s opening plate and the design story on the product page.",
  ],
  [
    "archive",
    "My Archive",
    "What a buyer reads in My Archive, and the public preview on the product page.",
  ],
  ["wallpapers", "Wallpapers", "What a buyer downloads: one phone and one desktop file."],
  [
    "fourthwall",
    "Fourthwall",
    "The product in the shop. Prices, stock and checkout come from here once it is public.",
  ],
  ["publish", "Publish", "What publishing needs, and what goes live with the piece."],
] as const;
type Tab = (typeof TABS)[number][0];

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

export default async function ReviewPiecePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const found = await getPiece((await params).slug);
  if (!found) notFound();
  const asked = (await searchParams).tab;
  const at = Math.max(
    0,
    TABS.findIndex(([id]) => id === asked),
  );
  const [tab, title, intro] = TABS[at]!;
  const next = TABS[at + 1];
  const { piece, collection } = found;
  const designKey = designKeyOf(found);
  const href = (id: Tab) => `/account/admin/pieces/${piece.slug}?tab=${id}`;
  const readiness = await pieceReadiness(found);
  const missing = readiness.required.filter((c) => !c.ok);
  const ready = readiness.required.length - missing.length;

  return (
    <>
      <PageHeader
        title={piece.name}
        note={`${PIECE_STATUS[piece.status]}. In ${collection.name}, ${collection.status === "published" ? "a published collection" : "a draft collection"}.`}
      />
      <div className="review-head">
        <div className="admin-inline">
          <Link className="aw-btn aw-btn-secondary" href={`/preview/${piece.slug}`} target="_blank">
            Preview as customer
          </Link>
          <Link href={`/account/admin/collections/${collection.slug}`}>The collection</Link>
        </div>
        <p className="aw-small">
          {missing.length
            ? `Required to publish: ${ready} of ${readiness.required.length} ready. Missing: ${missing.map((c) => c.label.toLowerCase()).join(", ")}. `
            : "Everything publishing needs is ready. "}
          <Link href={href("publish")}>See Publish</Link>
        </p>
      </div>

      <nav aria-label="Review steps" className="admin-filter review-tabs">
        {TABS.map(([id, label]) => (
          <Link key={id} href={href(id)} aria-current={id === tab ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>

      <section className="review-step" aria-labelledby="step-title">
        <header>
          <h2 id="step-title" className="aw-h2">
            {title}
          </h2>
          <p className="field-help">{intro}</p>
        </header>
        <Step tab={tab} found={found} designKey={designKey} readiness={readiness} />
        {next ? (
          <p>
            <Link className="review-next" href={href(next[0])}>
              Next: {next[1]}
            </Link>
          </p>
        ) : null}
      </section>
    </>
  );
}

async function Step({
  tab,
  found,
  designKey,
  readiness,
}: {
  tab: Tab;
  found: NonNullable<Awaited<ReturnType<typeof getPiece>>>;
  designKey: string;
  readiness: Awaited<ReturnType<typeof pieceReadiness>>;
}): Promise<ReactNode> {
  const { piece, collection } = found;
  // Forms start from what the server holds, so a save or a replaced image resets them.
  const key = piece.updated_at;

  switch (tab) {
    case "shop":
      return (
        <div className="review-split">
          <ul className="review-tiles">
            {piece.images.slice(0, 2).map((img, i) => (
              <li key={img.url}>
                <ImageTile src={img.url} label={i === 0 ? "Listing image" : "Hover image"}>
                  <ImageReplace
                    target={{ kind: "piece", slug: piece.slug, slot: "gallery", index: i }}
                  />
                </ImageTile>
              </li>
            ))}
          </ul>
          <div className="admin-editor">
            <ShopCardForm
              key={key}
              slug={piece.slug}
              name={piece.name}
              priceCents={piece.price_cents}
              featured={piece.featured}
            />
            <p className="field-help">
              Collection: {collection.name}. It is part of the piece’s Archive record, so it stays
              as imported.
            </p>
          </div>
        </div>
      );

    case "product": {
      const guide = (await listSizeGuides()).find((g) => g.id === piece.size_guide_id);
      return (
        <>
          <GalleryForm
            key={piece.images.map((i) => i.url).join()}
            slug={piece.slug}
            images={piece.images}
          />
          <ProductForm
            key={key}
            slug={piece.slug}
            code={piece.code}
            category={piece.category}
            categories={fileContent.categories}
            colors={piece.colors}
            sizes={guide ? guide.rows.map((r) => r.size) : []}
            sizePriceCents={piece.size_price_cents}
            scripture={piece.scripture}
            story={piece.story}
          />
        </>
      );
    }

    case "size": {
      const guides = await listSizeGuides();
      const guide = guides.find((g) => g.id === piece.size_guide_id);
      return (
        <div className="review-split">
          <div className="admin-editor">
            {guide?.image ? (
              <ImageTile src={guide.image.url} label="The guide’s image" shape="free" />
            ) : (
              <p className="field-help">No image: the product page shows the table.</p>
            )}
            {guide ? (
              <ImageReplace
                target={{ kind: "guide", id: guide.id }}
                label={guide.image ? "Replace the image" : "Add an image"}
              />
            ) : null}
          </div>
          <div className="admin-editor">
            <GuidePicker
              key={key}
              slug={piece.slug}
              current={piece.size_guide_id}
              guides={guides.map((g) => ({ id: g.id, name: g.name }))}
            />
            {guide ? (
              <SizeGuideForm
                key={`${guide.id}-${JSON.stringify(guide)}`}
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
            ) : null}
          </div>
        </div>
      );
    }

    case "home":
      return (
        <div className="review-split">
          <ul className="review-tiles">
            {(
              [
                ["piece", "The garment cut out", "portrait"],
                ["detail", "Close-up of the print", "portrait"],
                ["plateWide", "Plate, wide (desktop)", "wide"],
                ["plateTall", "Plate, tall (phones)", "tall"],
              ] as const
            ).map(([slot, label, shape]) => (
              <li key={slot}>
                <ImageTile src={piece.media[slot]} label={label} shape={shape}>
                  <ImageReplace target={{ kind: "piece", slug: piece.slug, slot }} />
                </ImageTile>
              </li>
            ))}
          </ul>
          <PlateForm key={key} slug={piece.slug} plate={piece.plate} />
        </div>
      );

    case "archive": {
      const [versions, open] = await Promise.all([
        listContentVersions(designKey),
        getOpenDraft(designKey),
      ]);
      const published = versions.find((v) => v.status === "published") ?? null;
      const working = open ?? published;
      return (
        <DraftEditor
          designKey={designKey}
          initial={working ? rowToFields(working) : EMPTY}
          openStatus={open ? (open.status === "approved" ? "approved" : "draft") : null}
          hasPublished={Boolean(published)}
          suggestion={suggestionFor(designKey, working ? rowToFields(working) : null)}
        />
      );
    }

    case "wallpapers": {
      const assets = (await listAssets(designKey)).filter((a) => a.status !== "retired");
      const previews = await previewUrls(assets).catch(() => ({}) as Record<string, string>);
      return (
        <>
          <div className="review-split">
            {(["phone", "desktop"] as const).map((format) => {
              const mine = assets.filter((a) => a.format === format);
              return (
                <div key={format} className="admin-editor">
                  <h3 className="aw-h3">{format === "phone" ? "Phone" : "Desktop"}</h3>
                  {mine.length === 0 ? <p className="field-help">None yet.</p> : null}
                  <ul className="review-tiles">
                    {mine.map((a) => (
                      <li key={a.id}>
                        <ImageTile
                          src={previews[a.id] ?? ""}
                          label={`${a.width} x ${a.height}, ${a.status === "published" ? "published" : "not published"}`}
                          shape={format === "phone" ? "tall" : "wide"}
                        >
                          <AssetActions assetId={a.id} publishable={a.status === "uploaded"} />
                        </ImageTile>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <h3 className="aw-h3">Upload another file</h3>
          <AssetUploader designs={[{ key: designKey, name: piece.name }]} />
        </>
      );
    }

    case "fourthwall": {
      const product = readiness.live;
      const price = (size: string) => piece.size_price_cents[size] ?? piece.price_cents;
      const gaps = (product?.variants ?? []).flatMap((v) => {
        const size = v.attributes.size?.name ?? "One size";
        const theirs = Math.round(v.unitPrice.value * 100);
        return theirs !== price(size)
          ? [`${size}: Fourthwall ${formatPrice(theirs)}, here ${formatPrice(price(size))}`]
          : [];
      });
      const refs = await importRefs(piece.import_id, (n) => n.startsWith("fourthwall-images/"));
      return (
        <>
          <div className="review-split">
            <FourthwallForm
              key={key}
              slug={piece.slug}
              fourthwallSlug={piece.fourthwall_slug}
              offerId={piece.fourthwall_offer_id}
            />
            <div className="admin-editor">
              {product ? (
                <>
                  <p className="aw-body">
                    Matched: {product.slug}, {product.state.type.toLowerCase()},{" "}
                    {(product.access?.type ?? "PUBLIC").toLowerCase()}.
                  </p>
                  {gaps.length ? (
                    <ul className="admin-list">
                      {gaps.map((g) => (
                        <li key={g} className="aw-form-error">
                          Price differs: {g}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="field-help">Its prices match the piece’s.</p>
                  )}
                </>
              ) : (
                <p className="aw-body">
                  No Fourthwall product matches yet. Fourthwall’s storefront lists only public
                  products, so make it public there; it still stays off this site until you publish
                  the piece here.
                </p>
              )}
            </div>
          </div>
          {product ? (
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
          ) : null}
          {product?.images.length || refs.length ? (
            <details>
              <summary className="aw-h3">Fourthwall’s images, for reference</summary>
              <ul className="review-tiles">
                {(product?.images ?? []).slice(0, 4).map((img, i) => (
                  <li key={img.url}>
                    <ImageTile
                      src={img.transformedUrl || img.url}
                      label={`In the shop, ${i + 1}`}
                    />
                  </li>
                ))}
                {refs.map(([name, url]) => (
                  <li key={name}>
                    <ImageTile src={url} label={`From the zip, ${name.split("/").pop()}`} />
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      );
    }

    case "publish": {
      const [pdf] = await importRefs(piece.import_id, (n) => n === "site-preview.pdf");
      return (
        <>
          <div className="review-split">
            <div className="admin-editor">
              <h3 className="aw-h3">Required</h3>
              <Checks items={readiness.required} />
              <h3 className="aw-h3">Worth having</h3>
              <Checks items={readiness.warned} />
            </div>
            <div className="admin-editor">
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
            </div>
          </div>
          {pdf ? (
            <details>
              <summary className="aw-h3">The site preview from the zip</summary>
              <p className="field-help">
                For reference; it isn’t published anywhere.{" "}
                <a href={pdf[1]} target="_blank" rel="noreferrer">
                  Open the PDF
                </a>
              </p>
              <iframe className="admin-pdf" src={pdf[1]} title="Site preview" />
            </details>
          ) : null}
        </>
      );
    }
  }
}

/** The import's reference files whose names match, as short-lived signed addresses. */
async function importRefs(
  importId: string | null,
  wanted: (name: string) => boolean,
): Promise<[string, string][]> {
  if (!importId) return [];
  const { data } = await db().from("piece_imports").select("*").eq("id", importId).maybeSingle();
  const paths = Object.entries((data as ImportRow | null)?.ref_paths ?? {})
    .filter(([name]) => wanted(name))
    .sort(([a], [b]) => a.localeCompare(b));
  const signed = await Promise.all(
    paths.map(async ([name, path]) => [name, await signedImportUrl(path)] as const),
  );
  return signed.filter((s): s is [string, string] => Boolean(s[1]));
}
