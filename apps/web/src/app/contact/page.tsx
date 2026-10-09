import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/features/contact/contact-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Questions about an order, sizing or wholesale for your church. Write to us at ${SITE.contactEmail}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="aw-container" style={{ paddingBottom: "var(--space-24)" }}>
      <PageHeader
        eyebrow="Contact"
        title="Write to us"
        intro="Questions about an order, sizing, wholesale for your church or anything else. A real person reads every message."
      />
      <div className="split">
        <ContactForm />
        <aside
          style={{ display: "grid", gap: "var(--space-8)", alignContent: "start" }}
          aria-label="Other ways to reach us"
        >
          <div className="field">
            <p className="aw-label">Email us directly</p>
            <a
              href={`mailto:${SITE.contactEmail}`}
              style={{ color: "var(--accent-text)", fontSize: 18 }}
            >
              {SITE.contactEmail}
            </a>
            <p className="field-help">We reply within 72 hours.</p>
          </div>
          <div className="field">
            <p className="aw-label">Before you write</p>
            <p className="aw-small">
              Most answers about sizing, shipping and refunds are in the{" "}
              <Link href="/faq" style={{ color: "var(--accent-text)" }}>
                FAQ
              </Link>{" "}
              and our{" "}
              <Link href="/refunds" style={{ color: "var(--accent-text)" }}>
                refund policy
              </Link>
              .
            </p>
          </div>
          <div className="field">
            <p className="aw-label">Churches and ministries</p>
            <p className="aw-small">
              Choose “Wholesale or church orders” and tell us how many pieces and when you need
              them.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
