import Link from "next/link";
import { LegalPage, type LegalSection } from "@/features/legal/legal-page";
import { SITE, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  path: "/refunds",
  title: "Returns and refunds",
  description:
    "Every Awebound piece is made to order. Damaged, misprinted or defective pieces, and the wrong item or size sent, are replaced or refunded when reported within 30 days of delivery.",
});

const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

/**
 * Matches the return policy of Fourthwall, which makes, ships and supports every order
 * (help.fourthwall.com: "Returns, refunds & quality issues" and "Cancel, refund, exchange,
 * return"). Change this page, the FAQ, the product page summary and llms.txt together.
 */
const sections: LegalSection[] = [
  {
    id: "summary",
    title: "In short",
    body: (
      <p>
        Every Awebound piece is printed or embroidered for you after you order it. If it arrives
        damaged, misprinted or defective, or we send the wrong item or size, tell us within{" "}
        <strong>30 days of delivery</strong> with a photo. We’ll send a replacement at no cost to
        you, or refund you if a replacement isn’t possible. Because each piece is made to order, we
        can’t take returns or exchanges for a size you chose or a change of mind.
      </p>
    ),
  },
  {
    id: "covered",
    title: "What’s covered",
    body: (
      <ul>
        <li>A misprint: a design printed off-center, faded or smeared, or faulty embroidery.</li>
        <li>Damage in transit: a piece that arrives torn, crushed or water-damaged.</li>
        <li>A defect in the garment itself, such as a hole, a tear or a failed seam.</li>
        <li>
          The wrong item or the wrong size: anything different from what your order confirmation
          shows.
        </li>
      </ul>
    ),
  },
  {
    id: "not-covered",
    title: "What isn’t covered",
    body: (
      <ul>
        <li>
          A size you chose that doesn’t fit. We exchange a size only when it differs from the one
          you ordered. Each product page has a size guide, and we’re glad to help you choose before
          you order.
        </li>
        <li>A change of mind.</li>
        <li>
          The softer, slightly muted look of colors printed directly onto dark garments. That’s how
          this printing works, not a defect.
        </li>
        <li>Wear and tear, or damage from washing or drying against the care instructions.</li>
        <li>Damage or defects reported more than 30 days after delivery.</li>
      </ul>
    ),
  },
  {
    id: "how",
    title: "How to report a problem",
    body: (
      <ol>
        <li>Email {mail} within 30 days of delivery.</li>
        <li>
          Include your order number, the item and a clear photo of the problem. For a wrong size,
          add a photo of the size label.
        </li>
        <li>
          We review it with our production partner and send a replacement at no cost to you, or
          refund you if a replacement isn’t possible. If a piece needs to come back, return shipping
          is covered.
        </li>
      </ol>
    ),
  },
  {
    id: "timing",
    title: "Refund timing",
    body: (
      <p>
        Refunds go back to your original payment method. Your bank or card issuer usually shows it
        within 5 to 10 business days.
      </p>
    ),
  },
  {
    id: "cancellations",
    title: "Changes and cancellations",
    body: (
      <p>
        Production can start soon after you order. Email us as soon as you can: an order, including
        its shipping address, can be changed or canceled only until production starts or a shipping
        label is created. After that it can’t be canceled.
      </p>
    ),
  },
  {
    id: "shipping",
    title: "Lost packages and address changes",
    body: (
      <>
        <p>
          If tracking hasn’t updated for 2 weeks (3 weeks for orders shipped outside the US), write
          to us with your order number. We’ll treat the package as lost and send a replacement, or
          refund you if a replacement isn’t possible. If tracking shows a package as delivered but
          it didn’t arrive, write to us and we’ll look into it.
        </p>
        <p>
          Once a package has shipped, its address can’t be changed in our system. Write to us and
          we’ll ask the carrier whether it can redirect the package; carriers may charge for this.
        </p>
      </>
    ),
  },
  {
    id: "eu-uk",
    title: "Customers in the EU, UK and EEA",
    body: (
      <p>
        If you live in the EU, the UK or the EEA, you may have a legal right to withdraw from your
        order within 14 days of delivery, even though each piece is made to order. Where it’s
        available, the withdrawal option is on your order status page (“View or manage your order”).
        Nothing in this policy limits the rights you have under the law where you live.
      </p>
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
      title="Returns and refunds"
      current="/refunds"
      intro="Made to order, and made right. If it isn’t, we’ll fix it."
      sections={sections}
    />
  );
}
