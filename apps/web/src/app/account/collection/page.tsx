import { redirect } from "next/navigation";

/** Your collection is My Archive's landing page now; old links land there. */
export default function CollectionPage() {
  redirect("/account");
}
