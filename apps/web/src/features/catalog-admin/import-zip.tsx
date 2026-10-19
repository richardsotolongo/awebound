"use client";

import { Button } from "@awebound/brand";
import { zipSync } from "fflate";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { mb } from "@/lib/prepare-image";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  checkImportAction,
  commitImportAction,
  createImportAction,
} from "@/server/catalog-admin-actions";
import { CollectionSchema } from "@/shared";
import type { CollectionFields, ImportCollection, ZipReport } from "@/shared/pieces";
import { unpackZip, zipJson } from "@/shared/piece-zip";
import { CollectionForm } from "./collection-form";

interface Chosen {
  name: string;
  blob: Blob;
  piece: { slug?: string; name?: string; collection?: string } | null;
  /** collection.json, as a new collection's fields. */
  offered: CollectionFields | null;
}

/**
 * One piece zip: it is read here first (print and preview files left out, piece.json and
 * collection.json read), uploaded straight to private storage, checked against the collection it
 * goes in, then everything in it is created as drafts.
 */
export function ImportZip({
  collections,
}: {
  collections: { slug: string; name: string; number: string; position: number }[];
}) {
  const id = useId();
  const router = useRouter();
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [create, setCreate] = useState<CollectionFields | null>(null);
  const [report, setReport] = useState<ZipReport | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function choose(file: File | undefined) {
    setChosen(null);
    setImportId(null);
    setReport(null);
    setError("");
    if (!file) return;
    setBusy("Reading the zip…");
    try {
      const files = unpackZip(new Uint8Array(await file.arrayBuffer()));
      const piece = zipJson(files, "piece.json") as Chosen["piece"];
      const collection = CollectionSchema.safeParse(zipJson(files, "collection.json"));
      const offered = collection.success
        ? {
            ...collection.data,
            releasedAt: "",
            position: Math.max(0, ...collections.map((c) => c.position)) + 1,
          }
        : null;
      const blob = new Blob([new Uint8Array(zipSync(files, { level: 0 }))], {
        type: "application/zip",
      });
      setChosen({ name: file.name.replace(/[^\w.-]+/g, "-"), blob, piece, offered });
      setCreate(offered);
      const named = collections.find((c) => c.slug === piece?.collection);
      setTarget(named ? named.slug : offered ? "" : (collections[0]?.slug ?? ""));
    } catch {
      setError("That file isn’t a zip that can be read.");
    } finally {
      setBusy("");
    }
  }

  const choice = (): ImportCollection | null =>
    target ? { existing: target } : create ? { create } : null;

  /** Uploads the zip once; later checks and the import reuse it. */
  async function uploaded(): Promise<string | null> {
    if (importId) return importId;
    if (!chosen) return null;
    const supabase = getBrowserSupabase();
    if (!supabase) throw new Error("Accounts aren’t set up yet.");
    setBusy("Uploading…");
    const created = await createImportAction({ fileName: chosen.name });
    if (!created.ok) throw new Error(created.error);
    const { bucket, path, token, importId: newId } = created.data;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, chosen.blob, { contentType: "application/zip" });
    if (uploadError) throw new Error(`The upload didn’t arrive: ${uploadError.message}`);
    setImportId(newId);
    return newId;
  }

  async function step(work: () => Promise<void>) {
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn’t work. Try again in a moment.");
    } finally {
      setBusy("");
    }
  }

  const check = () =>
    step(async () => {
      const collection = choice();
      if (!collection) throw new Error("Choose a collection, or create the one in the zip.");
      const zip = await uploaded();
      if (!zip) return;
      setBusy("Checking…");
      const result = await checkImportAction({ importId: zip, collection });
      if (!result.ok) throw new Error(result.error);
      setReport(result.data);
    });

  const commit = () =>
    step(async () => {
      const collection = choice();
      if (!collection || !importId) return;
      setBusy("Creating the drafts…");
      const result = await commitImportAction({ importId, collection });
      if (!result.ok) throw new Error(result.error);
      router.push(`/account/admin/pieces/${result.data.slug}`);
    });

  return (
    <div className="admin-editor">
      <div className="field">
        <label htmlFor={`${id}-zip`} className="aw-label">
          Piece zip
        </label>
        <input
          id={`${id}-zip`}
          className="asset-file"
          type="file"
          accept=".zip,application/zip"
          disabled={Boolean(busy)}
          onChange={(e) => void choose(e.target.files?.[0])}
        />
        {chosen ? (
          <p className="field-help">
            {chosen.piece?.name ?? "A piece with no readable piece.json"}, {mb(chosen.blob.size)} to
            upload (print and preview files are left out).
          </p>
        ) : (
          <p className="field-help">
            One zip, one garment: the slug-package.zip the new-piece skill makes.
          </p>
        )}
      </div>

      {chosen ? (
        <div className="field">
          <label htmlFor={`${id}-collection`} className="aw-label">
            Collection
          </label>
          <select
            id={`${id}-collection`}
            className="aw-select"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setReport(null);
            }}
          >
            {collections.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.number} {c.name}
              </option>
            ))}
            {chosen.offered && !collections.some((c) => c.slug === chosen.offered?.slug) ? (
              <option value="">Create this collection: {chosen.offered.name}</option>
            ) : null}
          </select>
        </div>
      ) : null}

      {chosen && !target && create ? (
        <div className="admin-suggestion">
          <p className="aw-h3">The new collection</p>
          <p className="field-help">
            From collection.json. Change anything before checking; it is created as a draft.
          </p>
          <CollectionForm
            key={chosen.name}
            slug={null}
            initial={create}
            onChange={(fields) => {
              setCreate(fields);
              setReport(null);
            }}
          />
        </div>
      ) : null}

      {chosen ? (
        <div className="admin-inline">
          <Button variant="secondary" disabled={Boolean(busy)} onClick={check}>
            {report ? "Check again" : "Upload and check"}
          </Button>
          {report && report.errors.length === 0 ? (
            <Button variant="primary" disabled={Boolean(busy)} onClick={commit}>
              Create the drafts
            </Button>
          ) : null}
        </div>
      ) : null}

      <p className="field-help" role="status" aria-live="polite">
        {busy}
      </p>
      {error ? (
        <p className="aw-form-error" role="alert">
          {error}
        </p>
      ) : null}

      {report ? (
        <div className="admin-editor">
          {report.errors.length ? (
            <>
              <h2 className="aw-h3">What’s wrong</h2>
              <ul className="admin-list">
                {report.errors.map((e) => (
                  <li key={e} className="aw-form-error">
                    {e}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="aw-body">
              Nothing stops the import. Everything is created as a draft: nothing is on the site
              until you approve it.
            </p>
          )}
          {report.warnings.length ? (
            <>
              <h2 className="aw-h3">Worth a look</h2>
              <ul className="admin-list">
                {report.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
