"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Outcome, useOwnerAction } from "@/features/archive/admin/owner-action";
import { editPieceAction, saveSizeGuideAction } from "@/server/catalog-admin-actions";
import type { Category, Plate, ProductImage, ProductStory, ScriptureRecord } from "@/shared";
import type { PiecePatch, SizeGuideFields } from "@/shared/pieces";
import { Check, Field, toCents, toDollars } from "./fields";
import { ImageReplace } from "./image-replace";
import { ImageTile } from "./image-tile";

/** Save, and what came of it beside the button. */
function SaveBar({
  busy,
  label,
  message,
  failed,
}: {
  busy: boolean;
  label: string;
  message: string;
  failed: boolean;
}) {
  return (
    <div className="review-save">
      <Button variant="secondary" type="submit" disabled={busy}>
        {busy ? "Working…" : label}
      </Button>
      <Outcome message={message} failed={failed} />
    </div>
  );
}

/** One step's form: its own fields and one Save. */
function PatchForm({
  slug,
  patch,
  children,
  label = "Save",
}: {
  slug: string;
  /** The step's fields as a patch, or a message when one isn't valid yet. */
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
      <SaveBar busy={busy} label={label} message={message} failed={failed} />
    </form>
  );
}

/** A group of fields under its own heading. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="review-group">
      <legend className="aw-h3">{title}</legend>
      {children}
    </fieldset>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id} className="aw-label">
        {label}
      </label>
      <select
        id={id}
        className="aw-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </div>
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
        label="Price in dollars"
        value={f.price}
        onChange={(v) => setF({ ...f, price: v })}
        help="Shown until the piece is on sale in Fourthwall; Fourthwall’s price wins then."
      />
      <Check
        label="Featured: the home page opens on the release’s first featured piece"
        checked={f.featured}
        onChange={(v) => setF({ ...f, featured: v })}
      />
    </PatchForm>
  );
}

const STORY: Record<
  Exclude<keyof ProductStory, "process">,
  { label: string; lines?: number; max: number }
> = {
  theme: { label: "Theme, in one word", max: 60 },
  call: { label: "Call: the design story’s headline", max: 120 },
  art: { label: "What the art shows, in one sentence", lines: 2, max: 500 },
  meaning: { label: "What it means", lines: 6, max: 3000 },
  front: { label: "Front", lines: 2, max: 300 },
  back: { label: "Back", lines: 2, max: 300 },
  inks: { label: "Inks or thread", max: 200 },
  fit: { label: "Fit", max: 200 },
  material: { label: "Fabric", max: 300 },
};
type StoryKey = keyof typeof STORY;

/** The product page's words, grouped as the page shows them. */
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
  const [f, setF] = useState({ code, category, colors: colors.join(", ") });
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      sizes.map((s) => [s, sizePriceCents[s] ? toDollars(sizePriceCents[s]) : ""]),
    ),
  );
  const [verse, setVerse] = useState(scripture);
  const [words, setWords] = useState<Record<StoryKey, string>>(
    Object.fromEntries(Object.keys(STORY).map((k) => [k, story[k as StoryKey] ?? ""])) as Record<
      StoryKey,
      string
    >,
  );
  const [process, setProcess] = useState(story.process);
  const word = (key: StoryKey) => (
    <Field
      label={STORY[key].label}
      value={words[key]}
      lines={STORY[key].lines}
      max={STORY[key].max}
      onChange={(v) => setWords({ ...words, [key]: v })}
    />
  );

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
            ...words,
            material: words.material.trim() ? words.material : null,
            process,
          },
        };
      }}
    >
      <Group title="Garment">
        <div className="review-fields">
          <Select
            label="Garment"
            value={f.category}
            onChange={(v) => setF({ ...f, category: v })}
            options={categories.map((c) => [c.slug, c.name])}
          />
          <Field
            label="Internal code (never shown)"
            value={f.code}
            onChange={(v) => setF({ ...f, code: v })}
          />
        </div>
        <Field
          label="Colors, the base color first"
          value={f.colors}
          onChange={(v) => setF({ ...f, colors: v })}
          help="Separated by commas, named as Fourthwall names them."
        />
      </Group>

      <Group title="Sizes and prices">
        {sizes.length ? (
          <>
            <p className="field-help">
              The sizes come from the size guide. A price left empty is the base price.
            </p>
            <div className="review-sizes">
              {sizes.map((size) => (
                <Field
                  key={size}
                  label={size}
                  value={prices[size] ?? ""}
                  onChange={(v) => setPrices({ ...prices, [size]: v })}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="field-help">Choose a size guide first: its sizes are the piece’s sizes.</p>
        )}
      </Group>

      <Group title="Scripture">
        <Field
          label="Reference (Isaiah 1:18)"
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
      </Group>

      <Group title="Design story">
        <div className="review-fields">
          {word("theme")}
          {word("call")}
        </div>
        {word("art")}
        {word("meaning")}
      </Group>

      <Group title="Product details">
        <div className="review-fields">
          {word("front")}
          {word("back")}
          {word("inks")}
          {word("fit")}
          {word("material")}
          <Select
            label="Process"
            value={process}
            onChange={(v) => setProcess(v === "embroidered" ? "embroidered" : "printed")}
            options={[
              ["printed", "Printed"],
              ["embroidered", "Embroidered"],
            ]}
          />
        </div>
      </Group>
    </PatchForm>
  );
}

const ROLE = ["the listing image", "the hover image"];

/** The gallery in order: view and alt text per image, moved earlier or later; each replaced on its own. */
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
  const moved = list.some((x, j) => x.url !== images[j]?.url);
  return (
    <PatchForm slug={slug} patch={() => ({ images: list })} label="Save order and alt text">
      <ol className="review-tiles">
        {list.map((img, i) => (
          <li key={img.url}>
            <ImageTile src={img.url} label={`${i + 1}${ROLE[i] ? `, ${ROLE[i]}` : ""}`}>
              <Select
                label="View"
                value={img.view}
                onChange={(v) => set(i, { ...img, view: v as ProductImage["view"] })}
                options={[
                  ["back", "Back"],
                  ["front", "Front"],
                  ["side", "Side"],
                  ["detail", "Detail"],
                ]}
              />
              <Field
                label="Alt text"
                value={img.alt}
                lines={3}
                onChange={(v) => set(i, { ...img, alt: v })}
              />
              <div className="admin-inline">
                <Button variant="link" disabled={i === 0} onClick={() => move(i, -1)}>
                  Earlier
                </Button>
                <Button variant="link" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                  Later
                </Button>
              </div>
              {moved ? (
                <p className="field-help">Save the order before replacing an image.</p>
              ) : (
                <ImageReplace target={{ kind: "piece", slug, slot: "gallery", index: i }} />
              )}
            </ImageTile>
          </li>
        ))}
      </ol>
    </PatchForm>
  );
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** The plate: its token, the ink its lettering takes, and the color standing in for a new token. */
export function PlateForm({ slug, plate }: { slug: string; plate: Plate | null }) {
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
      <Select
        label="Ink: what lettering and buttons take on the plate"
        value={f.ink}
        onChange={(v) => setF({ ...f, ink: v === "coal" ? "coal" : "bone" })}
        options={[
          ["bone", "Bone"],
          ["coal", "Coal"],
        ]}
      />
      <div className="admin-inline">
        {HEX.test(f.swatch) ? (
          // The surface's own color, read from its plate image: product data, like a swatch.
          <span className="review-swatch" style={{ background: f.swatch }} aria-hidden="true" />
        ) : null}
        <Field
          label="Surface color (#rrggbb)"
          value={f.swatch}
          onChange={(v) => setF({ ...f, swatch: v })}
        />
      </div>
      <p className="field-help">
        Read from the wide plate on import. It shows until the token is in the brand tokens.
      </p>
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
  const [value, setValue] = useState(current ?? "");
  return (
    <PatchForm slug={slug} patch={() => ({ sizeGuideId: value || null })} label="Use this guide">
      <Select
        label="Size guide"
        value={value}
        onChange={setValue}
        options={[
          ["", "None"],
          ...guides.map((g): [string, string] => [g.id, `${g.name} (${g.id})`]),
        ]}
      />
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
      <Group title="The guide">
        <div className="review-fields">
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
            label="Tolerance"
            value={f.tolerance ?? ""}
            onChange={(v) => setF({ ...f, tolerance: v || null })}
          />
        </div>
        <Field
          label="Sizing note (shown beside the sizes)"
          value={f.note ?? ""}
          onChange={(v) => setF({ ...f, note: v || null })}
        />
      </Group>
      <Group title="How to measure">
        <div className="review-fields">
          {f.measures.map((m, i) => (
            <Field
              key={i}
              label={m.label}
              value={m.how}
              onChange={(v) =>
                setF({ ...f, measures: f.measures.map((x, j) => (j === i ? { ...x, how: v } : x)) })
              }
            />
          ))}
        </div>
      </Group>
      <Group title="Measurements, in inches">
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
      </Group>
      <SaveBar busy={busy} label="Save size guide" message={message} failed={failed} />
    </form>
  );
}
