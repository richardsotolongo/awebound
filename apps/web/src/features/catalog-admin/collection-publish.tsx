"use client";

import { Button } from "@awebound/brand";
import { Outcome, useOwnerAction } from "@/features/archive/admin/owner-action";
import { publishCollectionAction, unpublishCollectionAction } from "@/server/catalog-admin-actions";

/**
 * Puts a release live with its approved pieces, or takes it down again. Their Fourthwall products
 * follow: public when the release goes live, hidden when it comes down.
 */
const withFourthwall = (line: string, fourthwall: string | null) =>
  fourthwall ? `${line} ${fourthwall}` : line;

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
              confirm(
                "Take this collection and all its pieces off the site? Their Fourthwall products will be hidden too.",
              ) &&
              run(
                () => unpublishCollectionAction({ slug }),
                (r) => withFourthwall("Unpublished.", r.fourthwall),
              )
            }
          >
            Unpublish collection
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={busy}
            onClick={() =>
              confirm(
                "Publish this collection? Its approved pieces go live here and their Fourthwall products become public.",
              ) &&
              run(
                () => publishCollectionAction({ slug }),
                (r) =>
                  withFourthwall(
                    `Published with ${r.pieces} newly approved piece${r.pieces === 1 ? "" : "s"}.`,
                    r.fourthwall,
                  ),
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
