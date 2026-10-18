import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@awebound/brand";
import { PageHeader } from "@/components/page-header";
import { PIECE_STATUS } from "@/features/catalog-admin/status";
import { listPieces, type PieceWithCollection } from "@/server/catalog-admin/pieces";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pieces", robots: { index: false } };

export default async function PiecesPage() {
  const pieces = await listPieces();
  const groups = new Map<string, PieceWithCollection[]>();
  for (const p of pieces) groups.set(p.collection.id, [...(groups.get(p.collection.id) ?? []), p]);

  return (
    <>
      <PageHeader
        title="Pieces"
        intro="Every garment by collection. Open one to review everything a customer sees, then approve it."
      />
      <div className="admin-inline">
        <Button variant="secondary" href="/account/admin/pieces/import">
          Import a piece zip
        </Button>
      </div>
      {[...groups.values()].map((group) => {
        const collection = group[0]!.collection;
        return (
          <section key={collection.id} className="admin-section">
            <h2 className="aw-h3">
              <Link href={`/account/admin/collections/${collection.slug}`}>
                {collection.number} {collection.name}
              </Link>{" "}
              <span className="aw-small">({collection.status})</span>
            </h2>
            <div className="admin-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Piece</th>
                    <th>Slug</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map(({ piece }) => (
                    <tr key={piece.id}>
                      <td>
                        <Link href={`/account/admin/pieces/${piece.slug}`}>{piece.name}</Link>
                      </td>
                      <td>
                        <code className="admin-code">{piece.slug}</code>
                      </td>
                      <td>{PIECE_STATUS[piece.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {pieces.length === 0 ? <p className="aw-body">No pieces yet.</p> : null}
    </>
  );
}
