"use client";

import { Button } from "@awebound/brand";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Outcome, useOwnerAction } from "@/features/archive/admin/owner-action";
import {
  deletePieceDraftAction,
  publishPieceAction,
  unpublishPieceAction,
} from "@/server/catalog-admin-actions";
import type { PieceStatus } from "@/shared/pieces";
import { Check } from "./fields";

/**
 * Approve & publish, with what goes live beside the piece (all on by default); Unpublish; and
 * Delete draft for a piece that was never published.
 */
export function PublishPanel({
  slug,
  status,
  collectionLive,
  ready,
}: {
  slug: string;
  status: PieceStatus;
  collectionLive: boolean;
  ready: boolean;
}) {
  const router = useRouter();
  const [archive, setArchive] = useState(true);
  const [wallpapers, setWallpapers] = useState(true);
  const { busy, message, failed, run } = useOwnerAction();

  return (
    <div className="admin-editor">
      {status !== "published" ? (
        <>
          <Check label="Publish the piece" checked disabled />
          <Check
            label="Publish its My Archive copy (this approves the founder note as written)"
            checked={archive}
            onChange={setArchive}
          />
          <Check label="Publish its wallpapers" checked={wallpapers} onChange={setWallpapers} />
        </>
      ) : null}
      <div className="admin-inline">
        {status !== "published" ? (
          <Button
            variant="primary"
            disabled={busy || !ready}
            onClick={() =>
              run(
                () => publishPieceAction({ slug, archive, wallpapers }),
                (r) =>
                  r.live
                    ? "Published. It is on the site now."
                    : "Approved. It goes live when its collection is published.",
              )
            }
          >
            {collectionLive ? "Approve and publish" : "Approve"}
          </Button>
        ) : null}
        {status !== "draft" ? (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              confirm("Take this piece off the site and back to draft?") &&
              run(() => unpublishPieceAction({ slug }), "Back to draft.")
            }
          >
            Unpublish
          </Button>
        ) : null}
        {status !== "published" ? (
          <Button
            variant="link"
            disabled={busy}
            onClick={async () => {
              if (!confirm("Delete this draft with its images, Archive draft and wallpapers?"))
                return;
              if (await run(() => deletePieceDraftAction({ slug }), "Deleted."))
                router.push("/account/admin/pieces");
            }}
          >
            Delete draft
          </Button>
        ) : null}
      </div>
      <Outcome message={message} failed={failed} />
    </div>
  );
}
