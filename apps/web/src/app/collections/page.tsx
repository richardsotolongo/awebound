import { redirect } from "next/navigation";

/** Collections and the shop show the same pieces while there is one release, so this is the shop. */
export default function CollectionsPage() {
  redirect("/shop");
}
