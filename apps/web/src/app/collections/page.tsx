import { Button, ScriptureRef } from "@awebound/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { EMPTY_LIST } from "@/features/catalog/query";
import { getReleases, searchProducts, withFallback } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Every Awebound release by name. Each collection is a set of pieces drawn from one call in Scripture.",
  alternates: { canonical: "/collections" },
};

export const revalidate = 60;

/** Every release that has pieces on the site, newest first. Only real releases are listed. */
export default async function CollectionsPage() {
  const releases = await withFallback(getReleases, []);
  const covers = await Promise.all(
    releases.map((r) =>
      withFallback(() => searchProducts({ collection: [r.slug], pageSize: 3 }), EMPTY_LIST).then(
        (list) => list.items,
      ),
    ),
  );

  return (
    <div className="aw-container section collections">
      <header className="collections-head">
        <p className="aw-label">Collections</p>
        <h1 className="aw-h1">Every release, by name</h1>
        <p className="aw-body">
          Each Awebound collection is a small set of pieces drawn from one call in Scripture. The
          newest is always under Latest Drop in the shop.
        </p>
      </header>

      {releases.length === 0 ? (
        <p className="aw-body">The first collection is on its way.</p>
      ) : (
        <ul className="collections-list">
          {releases.map((r, i) => (
            <li key={r.slug} className="collection-row">
              <Link href={`/collections/${r.slug}`} className="collection-covers" tabIndex={-1}>
                {covers[i]?.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element -- catalog images
                  <img key={p.slug} src={p.image.url} alt="" loading="lazy" decoding="async" />
                ))}
              </Link>
              <div className="collection-text">
                <p className="aw-label">
                  {i === 0 ? "Latest drop · " : ""}Release {r.number} · {r.pieces}{" "}
                  {r.pieces === 1 ? "piece" : "pieces"}
                </p>
                <h2 className="collection-name">
                  <Link href={`/collections/${r.slug}`}>{r.name}</Link>
                </h2>
                <p className="aw-body">{r.tagline}</p>
                <ScriptureRef reference={r.scriptureRef} align="start" />
                {r.status === "preview" ? (
                  <p className="release-status">
                    <span className="release-status-dot" aria-hidden="true" />
                    Coming soon: ordering isn’t open yet
                  </p>
                ) : null}
                <div className="aw-btn-row">
                  <Button variant="secondary" href={`/collections/${r.slug}`}>
                    Explore {r.name}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
