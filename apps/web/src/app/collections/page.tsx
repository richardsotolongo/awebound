import { Button, ScriptureRef } from "@awebound/brand";
import { FitName } from "@/components/fit-name";
import { EMPTY_LIST, shopCanonical } from "@/features/catalog/query";
import { ReleaseWall } from "@/features/release/release-wall";
import { pageMeta } from "@/lib/site";
import { getReleases, searchProducts, withFallback } from "@/server/catalog";

export const metadata = pageMeta({
  path: "/collections",
  title: "Collections",
  description:
    "Every Awebound release by name. Each collection is a set of pieces drawn from one call in Scripture.",
});

export const revalidate = 60;

/**
 * Every release that has pieces on the site, newest first, each under its name with the wall of
 * its pieces. Only real releases are listed.
 */
export default async function CollectionsPage() {
  const releases = await withFallback(getReleases, []);
  const walls = await Promise.all(
    releases.map((r) =>
      withFallback(() => searchProducts({ collection: [r.slug], pageSize: 48 }), EMPTY_LIST).then(
        (list) => list.items,
      ),
    ),
  );

  return (
    <div className="collections">
      <header className="aw-container collections-head">
        <h1 className="aw-h1">Every release, by name</h1>
        <p className="aw-body">
          Each Awebound collection is a small set of pieces drawn from one call in Scripture. The
          newest is always under Latest Drop in the shop.
        </p>
      </header>

      {releases.length === 0 ? (
        <p className="aw-container aw-body">The first collection is on its way.</p>
      ) : (
        releases.map((r, i) => {
          return (
            <section key={r.slug} className="release" aria-labelledby={`release-${r.slug}`}>
              <header className="aw-container release-head">
                <FitName id={`release-${r.slug}`}>{r.name}</FitName>
                <div className="release-sub">
                  <p className="release-tagline">{r.tagline}</p>
                  <ScriptureRef reference={r.scriptureRef} align="start" />
                </div>
                <p className="aw-small">
                  Release {r.number}, {r.pieces} {r.pieces === 1 ? "piece" : "pieces"}.
                </p>
                <div className="aw-btn-row">
                  <Button variant="secondary" href={`/collections/${r.slug}`}>
                    Shop {r.name}
                  </Button>
                </div>
              </header>
              <ReleaseWall
                pieces={walls[i] ?? []}
                label={`The ${r.name} pieces`}
                more={{ href: shopCanonical(r.slug), label: `See all ${r.pieces} pieces` }}
              />
            </section>
          );
        })
      )}
    </div>
  );
}
