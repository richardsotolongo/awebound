import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { FitForm } from "@/features/archive/fit-form";
import { getFitPreferences, listFitGuides } from "@/server/archive/fit";
import { currentUser } from "@/server/session";

export const metadata: Metadata = { title: "Your fit" };

export default async function FitPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?next=%2Faccount%2Ffit");
  const [guides, prefs] = await Promise.all([Promise.resolve(listFitGuides()), getFitPreferences(user.id)]);
  return (
    <>
      <PageHeader
        title="Your fit"
        intro={
          prefs.length > 0
            ? "Your remembered sizes, one per garment style."
            : "No fit saved yet. Pick the size you usually wear for each garment."
        }
      />
      <div className="account-panels">
        {guides.map((guide) => (
          <section key={guide.id} className="account-panel" aria-labelledby={`fit-${guide.id}`}>
            <h2 id={`fit-${guide.id}`} className="aw-h3">
              {guide.name}
            </h2>
            {guide.fit ? <p className="aw-small">{guide.fit}</p> : null}
            <FitForm guide={guide} initial={prefs.find((p) => p.guideId === guide.id) ?? null} />
          </section>
        ))}
      </div>
    </>
  );
}
