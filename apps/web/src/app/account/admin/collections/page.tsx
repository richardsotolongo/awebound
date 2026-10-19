import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { CollectionForm } from "@/features/catalog-admin/collection-form";
import { listCollections } from "@/server/catalog-admin/collections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collections", robots: { index: false } };

export default async function CollectionsPage() {
  const collections = await listCollections();
  return (
    <>
      <PageHeader
        title="Collections"
        intro="Each release and its pieces. A collection in draft is invisible on the site, approved pieces included; the newest published one is Latest Drop."
      />
      <section className="admin-section">
        <div className="admin-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Collection</th>
                <th>Slug</th>
                <th>Pieces</th>
                <th>Status</th>
                <th>Release date</th>
                <th>Order</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/account/admin/collections/${c.slug}`}>
                      {c.number} {c.name}
                    </Link>
                  </td>
                  <td>
                    <code className="admin-code">{c.slug}</code>
                  </td>
                  <td>{c.pieces}</td>
                  <td>{c.status}</td>
                  <td>{c.released_at ?? "–"}</td>
                  <td>{c.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {collections.length === 0 ? <p className="aw-body">No collections yet.</p> : null}
      </section>
      <section className="admin-section">
        <h2 className="aw-h3">New collection</h2>
        <CollectionForm slug={null} />
      </section>
    </>
  );
}
