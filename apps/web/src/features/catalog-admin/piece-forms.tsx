"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Outcome, useOwnerAction } from "@/features/archive/admin/owner-action";
import { editPieceAction, saveSizeGuideAction } from "@/server/catalog-admin-actions";
import type { Category, Plate, ProductImage, ProductStory, ScriptureRecord } from "@/shared";
import type { PiecePatch, SizeGuideFields } from "@/shared/pieces";
import { Check, Field, toCents, toDollars } from "./fields";
import { ImageReplace } from "./image-replace";

/** One section's form: its own fields, one Save, the outcome under it. */
function PatchForm({
  slug,
  patch,
  children,
  label = "Save",
}: {
  slug: string;
  /** The section's fields as a patch, or a message when one isn't valid yet. */
  patch: () => PiecePatch | string;
  children: ReactNode;
  label?: string;
}) {
  const { busy, message, failed, run } = useOwnerAction();
  function submit(e: FormEvent) {
    e.preventDefault();
    const p = patch();
    run(
      async () =>
        typeof p === "string"
          ? { ok: false as const, error: p }
          : editPieceAction({ slug, patch: p }),
      "Saved.",
    );
  }
  return (
    <form onSubmit={submit} className="admin-editor" noValidate>
      {children}
      <div>
        <Button variant="secondary" type="submit" disabled={busy}>
          {busy ? "Working…" : label}
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </form>
  );
}

/** The shop card's words: name, price, and whether the home page may open on it. */
export function ShopCardForm({
  slug,
  name,
  priceCents,
  featured,
}: {
  slug: string;
  name: string;
  priceCents: number;
  featured: boolean;
}) {
  const [f, setF] = useState({ name, price: toDollars(priceCents), featured });
  return (
    <PatchForm
      slug={slug}
      patch={() => {
        const cents = toCents(f.price);
        return Number.isNaN(cents)
          ? "Give the price in dollars, like 40."
          : { name: f.name, priceCents: cents, featured: f.featured };
      }}
    >
      <Field label="Name" value={f.name} max={80} onChange={(v) => setF({ ...f, name: v })} />
      <Field
        label="Price in dollars (shown until Fourthwall’s price takes over)"
        value={f.price}
        onChange={(v) => setF({ ...f, price: v })}
      />
      <Check
        label="Featured: the home page opens on the release’s first featured piece"
        checked={f.featured}
        onChange={(v) => setF({ ...f, featured: v })}
      />
    </PatchForm>
  );
}

const STORY: { key: keyof ProductStory; label: string; lines?: number; max: number }[] = [
  { key: "theme", label: "Theme, in one word", max: 60 },
  { key: "call", label: "Call (the design story’s headline: Behold His mercy)", max: 120 },
  { key: "art", label: "What the art shows, in one sentence", lines: 2, max: 500 },
  { key: "meaning", label: "What it means", lines: 6, max: 3000 },
  { key: "front", label: "Front", lines: 2, max: 300 },
  { key: "back", label: "Back", lines: 2, max: 300 },
  { key: "inks", label: "Inks or thread", max: 200 },
  { key: "fit", label: "Fit", max: 200 },
  { key: "material", label: "Material", max: 300 },
];

/** The product page's words: code, garment, colors, per-size prices, Scripture and the design story. */
export function ProductForm({
  slug,
  code,
  category,
  categories,
  colors,
  sizes,
  sizePriceCents,
  scripture,
  story,
}: {
  slug: string;
  code: string;
  category: string;
  categories: Category[];
  colors: string[];
  sizes: string[];
  sizePriceCents: Record<string, number>;
  scripture: ScriptureRecord;
  story: ProductStory;
}) {
  const id = useId();
  const [f, setF] = useState({ code, category, colors: colors.join(", ") });
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      sizes.map((s) => [s, sizePriceCents[s] ? toDollars(sizePriceCents[s]) : ""]),
    ),
  );
  const [verse, setVerse] = useState(scripture);
  const [words, setWords] = useState<Record<string, string>>(
    Object.fromEntries(STORY.map((s) => [s.key, story[s.key] ?? ""])),
  );
  const [process, setProcess] = useState(story.process);

  return (
    <PatchForm
      slug={slug}
      patch={() => {
        const sizePrices: Record<string, number> = {};
        for (const [size, dollars] of Object.entries(prices)) {
          if (!dollars.trim()) continue;
          const cents = toCents(dollars);
          if (Number.isNaN(cents)) return `Give the ${size} price in dollars, or leave it empty.`;
          sizePrices[size] = cents;
        }
        return {
          code: f.code,
          category: f.category,
          colors: f.colors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          sizePriceCents: sizePrices,
          scripture: verse,
          story: {
            theme: words.theme ?? "",
            call: words.call ?? "",
            art: words.art ?? "",
            meaning: words.meaning ?? "",
            front: words.front ?? "",
            back: words.back ?? "",
            inks: words.inks ?? "",
            fit: words.fit ?? "",
            material: words.material?.trim() ? words.material : null,
            process,
          },
        };
      }}
    >
      <Field
        label="Internal code (never shown)"
        value={f.code}
        onChange={(v) => setF({ ...f, code: v })}
      />
      <div className="field">
        <label htmlFor={`${id}-category`} className="aw-label">
          Garment
        </label>
        <select
          id={`${id}-category`}
          className="aw-select"
          value={f.category}
          onChange={(e) => setF({ ...f, category: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Field
        label="Colors, the base color first"
        value={f.colors}
        onChange={(v) => setF({ ...f, colors: v })}
        help="Separated by commas, named as Fourthwall names them."
      />
      <fieldset className="field">
        <legend className="aw-label">Sizes and per-size prices</legend>
        <p className="field-help">
          The sizes come from the size guide. Leave a price empty for the base price.
        </p>
        <div className="admin-inline">
          {sizes.map((size) => (
            <Field
              key={size}
              label={size}
              value={prices[size] ?? ""}
              onChange={(v) => setPrices({ ...prices, [size]: v })}
            />
          ))}
        </div>
      </fieldset>
      <Field
        label="Scripture reference (Isaiah 1:18)"
        value={verse.reference}
        onChange={(v) => setVerse({ ...verse, reference: v })}
      />
      <Field
        label="King James text, exact wording, no quotation marks"
        value={verse.kjv}
        lines={3}
        max={1000}
        onChange={(v) => setVerse({ ...verse, kjv: v })}
      />
      <Check
        label="An excerpt (part of the verse)"
        checked={verse.excerpt}
        onChange={(v) => setVerse({ ...verse, excerpt: v })}
      />
      {STORY.map((s) => (
        <Field
          key={s.key}
          label={s.label}
          value={words[s.key] ?? ""}
          lines={s.lines}
          max={s.max}
          onChange={(v) => setWords({ ...words, [s.key]: v })}
        />
      ))}
      <div className="field">
        <label htmlFor={`${id}-process`} className="aw-label">
          Process
        </label>
        <select
          id={`${id}-process`}
          className="aw-select"
          value={process}
          onChange={(e) => setProcess(e.target.value === "embroidered" ? "embroidered" : "printed")}
        >
          <option value="printed">Printed</option>
          <option value="embroidered">Embroidered</option>
        </select>
      </div>
    </PatchForm>
  );
}

/** The gallery in order: alt text and view per image, moved up and down; each replaced on its own. */
export function GalleryForm({ slug, images }: { slug: string; images: ProductImage[] }) {
  const [list, setList] = useState(images);
  const move = (i: number, by: number) =>
    setList((l) => {
      const next = [...l];
      const [item] = next.splice(i, 1);
      next.splice(i + by, 0, item!);
      return next;
    });
  const set = (i: number, image: ProductImage) =>
    setList(list.map((x, j) => (j === i ? image : x)));
  return (
    <PatchForm slug={slug} patch={() => ({ images: list })} label="Save order and alt text">
      <ol className="admin-gallery">
        {list.map((img, i) => (
          <li key={img.url}>
            {/* eslint-disable-next-line @next/next/no-img-element -- owner preview */}
            <img src={img.url} alt="" />
            <p className="aw-small">
              {i === 0 ? "1, the listing image" : i === 1 ? "2, the hover image" : String(i + 1)}
            </p>
            <Field
              label="Alt text"
              value={img.alt}
              lines={2}
              onChange={(v) => set(i, { ...img, alt: v })}
            />
            <div className="field">
              <label className="aw-small">
                View{" "}
                <select
                  className="aw-select"
                  value={img.view}
                  onChange={(e) => set(i, { ...img, view: e.target.value as ProductImage["view"] })}
                >
                  <option value="back">Back</option>
                  <option value="front">Front</option>
                  <option value="side">Side</option>
                  <option value="detail">Detail</option>
                </select>
              </label>
            </div>
            <div className="admin-inline">
              <Button variant="link" disabled={i === 0} onClick={() => move(i, -1)}>
                Earlier
              </Button>
              <Button variant="link" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                Later
              </Button>
            </div>
            {list === images || list.every((x, j) => x.url === images[j]?.url) ? (
              <ImageReplace target={{ kind: "piece", slug, slot: "gallery", index: i }} />
            ) : (
              <p className="field-help">Save the order to replace this image.</p>
            )}
          </li>
        ))}
      </ol>
    </PatchForm>
  );
}

/** The plate: its token, the ink its lettering takes, and the color standing in for a new token. */
export function PlateForm({ slug, plate }: { slug: string; plate: Plate | null }) {
  const id = useId();
  const [f, setF] = useState({
    token: plate?.token ?? "",
    ink: plate?.ink ?? "bone",
    swatch: plate?.swatch ?? "",
  });
  return (
    <PatchForm
      slug={slug}
      patch={() =>
        f.token.trim()
          ? {
              plate: {
                token: f.token.trim(),
                ink: f.ink === "coal" ? "coal" : "bone",
                ...(f.swatch.trim() ? { swatch: f.swatch.trim() } : {}),
              },
            }
          : { plate: null }
      }
    >
      <Field
        label="Plate token (plate-oxblood)"
        value={f.token}
        onChange={(v) => setF({ ...f, token: v })}
        help="Empty: no plate, and the piece shows on coal."
      />
      <div className="field">
        <label htmlFor={`${id}-ink`} className="aw-label">
          Ink (lettering on the plate)
        </label>
        <select
          id={`${id}-ink`}
          className="aw-select"
          value={f.ink}
          onChange={(e) => setF({ ...f, ink: e.target.value === "coal" ? "coal" : "bone" })}
        >
          <option value="bone">Bone</option>
          <option value="coal">Coal</option>
        </select>
      </div>
      <Field
        label="Surface color (#rrggbb)"
        value={f.swatch}
        onChange={(v) => setF({ ...f, swatch: v })}
        help="Read from plate-wide.webp on import. It shows until the token is in the brand tokens."
      />
    </PatchForm>
  );
}

/** Where the piece is in Fourthwall: its product slug and the offer id its orders arrive under. */
export function FourthwallForm({
  slug,
  fourthwallSlug,
  offerId,
}: {
  slug: string;
  fourthwallSlug: string;
  offerId: string | null;
}) {
  const [f, setF] = useState({ fourthwallSlug, offerId: offerId ?? "" });
  return (
    <PatchForm
      slug={slug}
      patch={() => ({ fourthwallSlug: f.fourthwallSlug, fourthwallOfferId: f.offerId })}
    >
      <Field
        label="Fourthwall product slug"
        value={f.fourthwallSlug}
        onChange={(v) => setF({ ...f, fourthwallSlug: v })}
      />
      <Field
        label="Offer id"
        value={f.offerId}
        onChange={(v) => setF({ ...f, offerId: v })}
        help="Stored with the Archive design too, as Mappings does."
      />
    </PatchForm>
  );
}

/** Which size guide the piece uses. */
export function GuidePicker({
  slug,
  current,
  guides,
}: {
  slug: string;
  current: string | null;
  guides: { id: string; name: string }[];
}) {
  const id = useId();
  const [value, setValue] = useState(current ?? "");
  return (
    <PatchForm slug={slug} patch={() => ({ sizeGuideId: value || null })} label="Use this guide">
      <div className="field">
        <label htmlFor={`${id}-guide`} className="aw-label">
          Size guide
        </label>
        <select
          id={`${id}-guide`}
          className="aw-select"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">None</option>
          {guides.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.id})
            </option>
          ))}
        </select>
      </div>
    </PatchForm>
  );
}

/** A size guide's words and table. It is shared, so saving changes every piece that uses it. */
export function SizeGuideForm({ id: guideId, guide }: { id: string; guide: SizeGuideFields }) {
  const [f, setF] = useState(guide);
  const { busy, message, failed, run } = useOwnerAction();
  const cell = (r: number, c: number, v: string) =>
    setF({
      ...f,
      rows: f.rows.map((row, i) =>
        i === r ? { ...row, values: row.values.map((x, j) => (j === c ? v : x)) } : row,
      ),
    });
  return (
    <form
      className="admin-editor"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        run(() => saveSizeGuideAction({ id: guideId, fields: f }), "Saved.");
      }}
    >
      <Field
        label="Name, as the guide prints it"
        value={f.name}
        onChange={(v) => setF({ ...f, name: v })}
      />
      <Field
        label="Blank (internal, never shown)"
        value={f.blank}
        onChange={(v) => setF({ ...f, blank: v })}
      />
      <Field label="Fit" value={f.fit ?? ""} onChange={(v) => setF({ ...f, fit: v || null })} />
      <Field
        label="Sizing note (shown beside the sizes)"
        value={f.note ?? ""}
        onChange={(v) => setF({ ...f, note: v || null })}
      />
      <Field
        label="Tolerance"
        value={f.tolerance ?? ""}
        onChange={(v) => setF({ ...f, tolerance: v || null })}
      />
      {f.measures.map((m, i) => (
        <Field
          key={i}
          label={`How to measure ${m.label}`}
          value={m.how}
          onChange={(v) =>
            setF({ ...f, measures: f.measures.map((x, j) => (j === i ? { ...x, how: v } : x)) })
          }
        />
      ))}
      <div className="admin-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Size</th>
              {f.measures.map((m) => (
                <th key={m.label}>{m.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {f.rows.map((row, r) => (
              <tr key={row.size}>
                <td>{row.size}</td>
                {row.values.map((v, c) => (
                  <td key={c}>
                    <input
                      className="aw-input"
                      aria-label={`${row.size} ${f.measures[c]?.label ?? ""}`}
                      value={v}
                      onChange={(e) => cell(r, c, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <Button variant="secondary" type="submit" disabled={busy}>
          {busy ? "Working…" : "Save size guide"}
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </form>
  );
}
