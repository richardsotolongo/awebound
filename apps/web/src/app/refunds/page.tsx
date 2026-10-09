import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/features/legal/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund policy",
  description:
    "Every Awebound piece is made to order. We refund or replace misprints, damage and wrong items reported within 30 days.",
  alternates: { canonical: "/refunds" },
};

const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

const sections: LegalSection[] = [
  {
    id: "summary",
    title: "In short",
    body: (
      <>
        <p>
          Every Awebound piece is printed or embroidered to order, just for you. If something
          arrives misprinted, damaged or different from what you ordered, tell us within{" "}
          <strong>30 days of delivery</strong> and we’ll replace it or refund you. Because pieces
          are made to order, we can’t take returns for size or a change of mind.
        </p>
      </>
    ),
  },
  {
    id: "covered",
    title: "What we cover",
    body: (
      <ul>
        <li>A misprint, faded or cracked print, or embroidery defect on arrival.</li>
        <li>Damage in transit, such as tears, holes or stains.</li>
        <li>The wrong item, color or size compared with your order confirmation.</li>
        <li>A defect in the garment itself, such as a failed seam.</li>
      </ul>
    ),
  },
  {
    id: "not-covered",
    title: "What we can’t accept",
    body: (
      <ul>
        <li>
          Returns or exchanges because a size you chose doesn’t fit. Each product page has a size
          guide, and we’re glad to help you choose before you order.
        </li>
        <li>Returns for a change of mind.</li>
        <li>Wear and tear, or damage from washing or drying against the care instructions.</li>
        <li>Problems reported more than 30 days after delivery.</li>
      </ul>
    ),
  },
  {
    id: "how",
    title: "How to request a replacement or refund",
    body: (
      <ol>
        <li>Email {mail} within 30 days of delivery.</li>
        <li>
          Include your order number, the item and a clear photo of the problem (and of the label for
          size issues).
        </li>
        <li>
          We reply within two business days. In most cases you won’t need to send anything back.
        </li>
        <li>You choose a replacement or a refund to your original payment method.</li>
      </ol>
    ),
  },
  {
    id: "timing",
    title: "Refund timing",
    body: (
      <p>
        Once we approve a refund we issue it right away. Your bank or card issuer usually shows it
        within 5 to 10 business days.
      </p>
    ),
  },
  {
    id: "cancellations",
    title: "Changes and cancellations",
    body: (
      <p>
        Production usually starts within a day of your order. Email us as soon as you can and we’ll
        change or cancel the order if it hasn’t gone to print. Once production has started we can’t
        cancel it.
      </p>
    ),
  },
  {
    id: "shipping",
    title: "Lost packages and address errors",
    body: (
      <>
        <p>
          If tracking stops moving or shows a package as delivered that you didn’t receive, write to
          us and we’ll work with the carrier to find it. If it’s confirmed lost, we’ll replace it.
        </p>
        <p>
          If an order is returned because the shipping address was entered incorrectly, we can send
          it again once the address is corrected; a new shipping charge may apply.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Questions",
    body: (
      <p>
        Write to {mail} or use the <Link href="/contact">contact form</Link>. A real person reads
        every message.
      </p>
    ),
  },
];

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund policy"
      current="/refunds"
      intro="Made to order, and made right. If it isn’t, we’ll fix it."
      sections={sections}
    />
  );
}
