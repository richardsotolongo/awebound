"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { unmeasured } from "@/components/fit-name";
import { Outcome, useOwnerAction } from "@/features/archive/admin/owner-action";
import { saveCollectionAction } from "@/server/catalog-admin-actions";
import type { CollectionFields } from "@/shared/pieces";
import { Field, slugify } from "./fields";

const EMPTY: CollectionFields = {
  slug: "",
  name: "",
  number: "",
  tagline: "",
  story: "",
  scriptureRef: "",
  releasedAt: "",
  position: 1,
};

/**
 * A collection's name, slug (made from the name until it is edited), number, tagline, story,
 * Scripture reference, release date and display order. `slug` null creates one.
 */
export function CollectionForm({
  slug,
  initial,
  slugLocked = false,
  onChange,
}: {
  slug: string | null;
  initial?: CollectionFields;
  slugLocked?: boolean;
  /** Hands each change to the page instead of saving (a collection created with an import). */
  onChange?: (fields: CollectionFields) => void;
}) {
  const router = useRouter();
  const [f, setF] = useState<CollectionFields>(initial ?? EMPTY);
  const [slugEdited, setSlugEdited] = useState(Boolean(slug));
  const { busy, message, failed, run } = useOwnerAction();
  const patch = (changes: Partial<CollectionFields>) => {
    const next = { ...f, ...changes };
    setF(next);
    onChange?.(next);
  };
  const set = <K extends keyof CollectionFields>(key: K, value: CollectionFields[K]) =>
    patch({ [key]: value });
  const missing = unmeasured(f.name);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (onChange) return;
    const ok = await run(() => saveCollectionAction({ slug, fields: f }), "Saved.");
    if (ok && f.slug !== slug) router.push(`/account/admin/collections/${f.slug}`);
  }

  return (
    <form onSubmit={submit} className="admin-editor" noValidate>
      <Field
        label="Name"
        value={f.name}
        max={80}
        onChange={(v) => patch(slugEdited ? { name: v } : { name: v, slug: slugify(v) })}
        help={
          missing.length
            ? `The release lettering hasn’t measured ${missing.join(" ")}, so the name sets a little short until it is added to WIDTHS in components/fit-name.tsx.`
            : undefined
        }
      />
      <Field
        label="Slug (its address: /collections/slug)"
        value={f.slug}
        onChange={(v) => {
          setSlugEdited(true);
          set("slug", v);
        }}
        help={slugLocked ? "It has pieces, so it keeps its slug." : undefined}
      />
      <Field label="Number, as shown (02)" value={f.number} onChange={(v) => set("number", v)} />
      <Field
        label="Tagline"
        value={f.tagline}
        max={300}
        lines={2}
        onChange={(v) => set("tagline", v)}
      />
      <Field label="Story" value={f.story} max={3000} lines={6} onChange={(v) => set("story", v)} />
      <Field
        label="Scripture reference (John 1:29)"
        value={f.scriptureRef}
        onChange={(v) => set("scriptureRef", v)}
      />
      <Field
        label="Release date"
        type="date"
        value={f.releasedAt}
        onChange={(v) => set("releasedAt", v)}
        help="Left empty, it is the day you publish the collection."
      />
      <Field
        label="Display order"
        type="number"
        value={String(f.position)}
        onChange={(v) => set("position", Math.max(1, Math.round(Number(v) || 1)))}
      />
      {onChange ? null : (
        <div>
          <Button
            variant="secondary"
            type="submit"
            disabled={busy || (slugLocked && f.slug !== slug)}
          >
            {busy ? "Working…" : slug ? "Save collection" : "Create collection"}
          </Button>
        </div>
      )}
      <Outcome message={message} failed={failed} />
    </form>
  );
}
