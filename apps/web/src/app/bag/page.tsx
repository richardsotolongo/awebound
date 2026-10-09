import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { BagPageContents } from "@/features/bag/bag-page";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false },
};

export default function BagPage() {
  return (
    <div className="aw-container" style={{ paddingBottom: "var(--space-24)" }}>
      <PageHeader eyebrow="Bag" title="Your bag" />
      <BagPageContents />
    </div>
  );
}
