"use client";

import { Button } from "@awebound/brand";
import { useState } from "react";
import { Outcome, useOwnerAction } from "@/features/archive/admin/owner-action";
import { reorderPiecesAction } from "@/server/catalog-admin-actions";

/** A release's pieces in their order, moved up and down, then saved. */
export function PieceOrder({
  collection,
  pieces,
}: {
  collection: string;
  pieces: { slug: string; name: string; status: string }[];
}) {
  const [order, setOrder] = useState(pieces);
  const { busy, message, failed, run } = useOwnerAction();
  const move = (i: number, by: number) =>
    setOrder((list) => {
      const next = [...list];
      const [item] = next.splice(i, 1);
      next.splice(i + by, 0, item!);
      return next;
    });
  const changed = order.some((p, i) => p.slug !== pieces[i]?.slug);

  return (
    <div className="admin-editor">
      <ol className="admin-list">
        {order.map((p, i) => (
          <li key={p.slug}>
            <div className="admin-inline">
              <a href={`/account/admin/pieces/${p.slug}`}>{p.name}</a>
              <span className="aw-small">{p.status}</span>
              <Button variant="link" disabled={i === 0} onClick={() => move(i, -1)}>
                Up
              </Button>
              <Button variant="link" disabled={i === order.length - 1} onClick={() => move(i, 1)}>
                Down
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <div>
        <Button
          variant="secondary"
          disabled={busy || !changed}
          onClick={() =>
            run(
              () => reorderPiecesAction({ collection, pieces: order.map((p) => p.slug) }),
              "Order saved.",
            )
          }
        >
          Save order
        </Button>
      </div>
      <Outcome message={message} failed={failed} />
    </div>
  );
}
