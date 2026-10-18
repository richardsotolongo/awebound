"use client";

import { Button } from "@awebound/brand";
import { Outcome, useOwnerAction } from "@/features/archive/admin/owner-action";
import { publishCollectionAction, unpublishCollectionAction } from "@/server/catalog-admin-actions";

/** Puts a release live with its approved pieces, or takes it down again. */
export function CollectionPublish({ slug, published }: { slug: string; published: boolean }) {
  const { busy, message, failed, run } = useOwnerAction();
  return (
    <div className="admin-editor">
      <div className="admin-inline">
        {published ? (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              confirm("Take this collection and all its pieces off the site?") &&
              run(() => unpublishCollectionAction({ slug }), "Unpublished.")
            }
          >
            Unpublish collection
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={busy}
            onClick={() =>
              run(
                () => publishCollectionAction({ slug }),
                (r) =>
                  `Published with ${r.pieces} newly approved piece${r.pieces === 1 ? "" : "s"}.`,
              )
            }
          >
            Publish collection
          </Button>
        )}
      </div>
      <Outcome message={message} failed={failed} />
    </div>
  );
}
