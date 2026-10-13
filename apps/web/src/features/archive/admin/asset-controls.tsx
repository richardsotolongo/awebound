"use client";

import { Button } from "@awebound/brand";
import { useId, useState, type FormEvent } from "react";
import { assignAssetAction, publishAssetAction, retireAssetAction } from "@/server/admin-actions";
import { Outcome, useOwnerAction } from "./owner-action";

/** Publish (when the file has a design) and retire for one uploaded file. */
export function AssetActions({ assetId, publishable }: { assetId: string; publishable: boolean }) {
  const { busy, message, failed, run } = useOwnerAction();
  return (
    <div className="field">
      <div className="admin-inline">
        {publishable ? (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => run(() => publishAssetAction({ assetId }), "Published.")}
          >
            Publish
          </Button>
        ) : null}
        <Button
          variant="link"
          disabled={busy}
          onClick={() => run(() => retireAssetAction({ assetId }), "Retired.")}
        >
          Retire
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </div>
  );
}

/** Moves a file ingested without a design onto one. */
export function AssignAssetForm({
  assetId,
  designs,
}: {
  assetId: string;
  designs: { key: string; name: string }[];
}) {
  const id = useId();
  const [designKey, setDesignKey] = useState(designs[0]?.key ?? "");
  const { busy, message, failed, run } = useOwnerAction();

  function submit(e: FormEvent) {
    e.preventDefault();
    run(() => assignAssetAction({ assetId, designKey }), "Assigned.");
  }

  return (
    <form onSubmit={submit} className="field" noValidate>
      <div className="admin-inline">
        <select
          id={`${id}-design`}
          className="aw-select"
          aria-label="Design"
          value={designKey}
          onChange={(e) => setDesignKey(e.target.value)}
        >
          {designs.map((d) => (
            <option key={d.key} value={d.key}>
              {d.name}
            </option>
          ))}
        </select>
        <Button variant="secondary" type="submit" disabled={busy || !designKey}>
          Assign
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </form>
  );
}
