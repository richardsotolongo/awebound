import { Button } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { RemoveSavedButton } from "@/features/archive/remove-saved-button";
import { listSavedPieces } from "@/server/archive/saved";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Saved pieces" };

export default async function SavedPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Fsaved");
  const saved = await listSavedPieces(user.id);
  return (
    <>
      <PageHeader
        title="Saved pieces"
        intro={saved.length > 0 ? "The pieces you saved from the shop, on every device you sign in to." : undefined}
      />
      {saved.length === 0 ? (
        <div className="shop-empty" role="status">
          <p className="aw-h3">Nothing saved yet.</p>
          <p className="aw-body">Pieces you save from the shop stay here on every device.</p>
          <div className="aw-btn-row">
            <Button variant="secondary" href="/shop">
              Visit the shop
            </Button>
          </div>
        </div>
      ) : (
        <ul className="archive-rows">
          {saved.map((s) => (
            <li key={s.slug} className="archive-row">
              {s.piece ? (
                // eslint-disable-next-line @next/next/no-img-element -- site image, plain img like the shop
                <img src={s.piece.image.url} alt="" />
              ) : (
                <div aria-hidden="true" />
              )}
              <div className="archive-row-words">
                {s.piece ? (
                  <>
                    <Link href={`/shop/${s.slug}`}>{s.piece.name}</Link>
                    <span className="aw-small">
                      {s.piece.cut}, {s.piece.color}
                    </span>
                    {s.piece.status ? <span className="aw-small">{s.piece.status}</span> : null}
                  </>
                ) : (
                  <>
                    <span className="aw-body">{s.slug.replace(/-/g, " ")}</span>
                    <span className="aw-small">No longer available</span>
                  </>
                )}
              </div>
              <RemoveSavedButton slug={s.slug} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
