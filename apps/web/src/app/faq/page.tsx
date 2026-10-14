import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { DELIVERY } from "@/lib/delivery";
import { SITE, pageMeta } from "@/lib/site";
import { TRANSLATION, TRANSLATION_NAME, TRANSLATION_NOTICE } from "@/server/scripture";

export const metadata = pageMeta({
  path: "/faq",
  title: "FAQ",
  description:
    "Answers about ordering, sizing, shipping, returns and the meaning behind Awebound designs.",
});

interface Faq {
  q: string;
  a: ReactNode;
  /** Plain-text answer for structured data. */
  text: string;
}

const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

const GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: "Ordering",
    items: [
      {
        q: "How do I order?",
        text: "Choose a piece, pick your color and size, and add it to your bag. When you’re ready, check out from the bag. You’ll get an order confirmation by email, and tracking once it ships.",
        a: (
          <p>
            Choose a piece, pick your color and size, and add it to your bag. When you’re ready,
            check out from the bag. You’ll get an order confirmation by email, and tracking once it
            ships.
          </p>
        ),
      },
      {
        q: "Do I need an account to order?",
        text: "No. You can check out as a guest. Accounts are free and optional: My Archive keeps your saved pieces, your fit and your orders in one place, and you sign in with Google or a one-time email link, with no password.",
        a: (
          <p>
            No. You can check out as a guest. Accounts are free and optional: My Archive keeps your
            saved pieces, your fit and your orders in one place, and you sign in with Google or a
            one-time email link, with no password.
          </p>
        ),
      },
      {
        q: "Can I change or cancel my order?",
        text: "Each piece is made to order, and production can start soon after you order. Email us right away: an order can be changed or canceled only until production starts or a shipping label is created.",
        a: (
          <p>
            Each piece is made to order, and production can start soon after you order. Email {mail}{" "}
            right away: an order can be changed or canceled only until production starts or a
            shipping label is created.
          </p>
        ),
      },
      {
        q: "Can a church or ministry order in bulk?",
        text: "Yes. Choose “Wholesale or church orders” on the contact form and tell us how many pieces you need and by when.",
        a: (
          <p>
            Yes. Choose “Wholesale or church orders” on the{" "}
            <Link href="/contact">contact form</Link> and tell us how many pieces you need and by
            when.
          </p>
        ),
      },
    ],
  },
  {
    title: "Sizing and fit",
    items: [
      {
        q: "How do your pieces fit?",
        text: "Each product page names its cut and has a size guide. Our oversized tees come in two cuts: regular oversized, which is wide with a dropped shoulder, and larger oversized, which is wider and boxier. Our hoodies are relaxed with a dropped shoulder, and both caps adjust at the back.",
        a: (
          <p>
            Each product page names its cut and has a size guide. Our oversized tees come in two
            cuts: regular oversized, which is wide with a dropped shoulder, and larger oversized,
            which is wider and boxier. Our hoodies are relaxed with a dropped shoulder, and both
            caps adjust at the back.
          </p>
        ),
      },
      {
        q: "Should I size up or down in the oversized tees?",
        text: "Order your usual size for the intended fit: both cuts are made to sit wide. Size down only if you want a closer fit. Each size guide has the garment measurements to compare with a tee you already own.",
        a: (
          <p>
            Order your usual size for the intended fit: both cuts are made to sit wide. Size down
            only if you want a closer fit. Each size guide has the garment measurements to compare
            with a tee you already own.
          </p>
        ),
      },
    ],
  },
  {
    title: "Shipping",
    items: [
      {
        q: "How long does delivery take?",
        text: `Every piece is made to order. Production takes ${DELIVERY.productionTime}, then shipping takes ${DELIVERY.shippingTime}. You’ll get tracking by email when your order ships; it can pause for a day or two while the package changes carriers.`,
        a: (
          <p>
            Every piece is made to order. Production takes {DELIVERY.productionTime}, then shipping
            takes {DELIVERY.shippingTime}. You’ll get tracking by email when your order ships; it
            can pause for a day or two while the package changes carriers.
          </p>
        ),
      },
      {
        q: "Where do you ship?",
        text: "Shipping destinations and rates are listed at checkout. If you don’t see your country, write to us.",
        a: (
          <p>
            Shipping destinations and rates are listed at checkout. If you don’t see your country,
            write to {mail}.
          </p>
        ),
      },
    ],
  },
  {
    title: "Returns and refunds",
    items: [
      {
        q: "What if my order arrives damaged, misprinted or wrong?",
        text: "Tell us within 30 days of delivery, with a photo, and we’ll send a replacement at no cost to you, or refund you if a replacement isn’t possible. If we sent the wrong size, include a photo of the size label.",
        a: (
          <p>
            Tell us within 30 days of delivery, with a photo, and we’ll send a replacement at no
            cost to you, or refund you if a replacement isn’t possible. If we sent the wrong size,
            include a photo of the size label. The details are in our{" "}
            <Link href="/refunds">returns and refunds policy</Link>.
          </p>
        ),
      },
      {
        q: "Can I return or exchange something that doesn’t fit?",
        text: "Because every piece is made for you, we can’t take returns or exchanges for a size you chose or a change of mind. If we sent a different size from the one you ordered, that’s covered: tell us within 30 days of delivery. Check the size guide before you order, and write to us if you’re unsure. Customers in the EU, UK and EEA keep their legal 14-day right of withdrawal.",
        a: (
          <p>
            Because every piece is made for you, we can’t take returns or exchanges for a size you
            chose or a change of mind. If we sent a different size from the one you ordered, that’s
            covered: tell us within 30 days of delivery. Check the size guide before you order, and
            write to us if you’re unsure. Customers in the EU, UK and EEA keep their legal 14-day
            right of withdrawal.
          </p>
        ),
      },
    ],
  },
  {
    title: "Your Archive",
    items: [
      {
        q: "What does an account give me?",
        text: "Right away: save the pieces you want to return to, remember your preferred sizes and view the right size guides, and keep your linked orders in one place. Each design you buy while signed in unlocks its full story, a note from Richard and its published digital extras in My Archive.",
        a: (
          <p>
            Right away: save the pieces you want to return to, remember your preferred sizes and
            view the right size guides, and keep your linked orders in one place. Each design you
            buy while signed in unlocks its full story, a note from Richard and its published
            digital extras in My Archive.
          </p>
        ),
      },
      {
        q: "How do I link an order I placed as a guest?",
        text: "Sign in with the email address you used at checkout and the order links itself. If you used a different address, open Orders in My Archive, choose Link a past order, and enter the order number: a code goes to the email address on that order.",
        a: (
          <p>
            Sign in with the email address you used at checkout and the order links itself. If you
            used a different address, open Orders in My Archive, choose Link a past order, and enter
            the order number: a code goes to the email address on that order.
          </p>
        ),
      },
      {
        q: "What is the Founding Member seal?",
        text: "The first 50 qualifying buyers who use their Awebound account at checkout receive a Founding Member seal. Guest purchases do not qualify. It is recognition on your Archive, not a discount.",
        a: (
          <p>
            The first 50 qualifying buyers who use their Awebound account at checkout receive a
            Founding Member seal. Guest purchases do not qualify. It is recognition on your Archive,
            not a discount.
          </p>
        ),
      },
    ],
  },
  {
    title: "The designs",
    items: [
      {
        q: "Why don’t your designs show Jesus?",
        text: "Out of reverence, we use symbols instead: a cross, a crown of thorns, the rolled-away stone, the Lamb, lilies. The story is His, and the art points to Him.",
        a: (
          <p>
            Out of reverence, we use symbols instead: a cross, a crown of thorns, the rolled-away
            stone, the Lamb, lilies. The story is His, and the art points to Him.
          </p>
        ),
      },
      {
        q: "Which Bible translation do you use?",
        text: `Scripture quoted on this website is from the ${TRANSLATION_NAME}. Every piece carries its full Scripture reference. The words printed on each design keep the wording it was drawn with, which is the King James Version on some pieces. ${TRANSLATION_NOTICE}`,
        a: (
          <>
            <p>
              Scripture quoted on this website is from the {TRANSLATION_NAME}. Every piece carries
              its full Scripture reference.
              {TRANSLATION === "KJV"
                ? " The lettering printed on some designs uses the same King James wording."
                : " The words printed on each design keep the wording it was drawn with, which is the King James Version on some pieces."}
            </p>
            <p className="aw-small">{TRANSLATION_NOTICE}</p>
          </>
        ),
      },
      {
        q: "How should I care for my piece?",
        text: "Turn it inside out, wash cold with like colors, and hang dry or tumble dry low. Don’t iron over the print.",
        a: (
          <p>
            Turn it inside out, wash cold with like colors, and hang dry or tumble dry low. Don’t
            iron over the print.
          </p>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: GROUPS.flatMap((g) => g.items).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.text },
    })),
  };

  return (
    <div className="aw-container" style={{ paddingBottom: "var(--space-24)" }}>
      <PageHeader
        title="Questions, answered"
        intro={<>Can’t find what you need? Write to {mail}.</>}
      />
      <div style={{ display: "grid", gap: "var(--space-16)", maxWidth: 860 }}>
        {GROUPS.map((group) => (
          <section
            key={group.title}
            aria-labelledby={`faq-${group.title}`}
            style={{ display: "grid", gap: "var(--space-4)" }}
          >
            <h2 id={`faq-${group.title}`} className="aw-label">
              {group.title}
            </h2>
            <div className="faq">
              {group.items.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <div className="answer">{f.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <JsonLd data={jsonLd} />
    </div>
  );
}
