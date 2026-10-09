import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about ordering, sizing, shipping, refunds and the meaning behind Awebound designs.",
  alternates: { canonical: "/faq" },
};

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
        q: "When can I order?",
        text: "Checkout is opening soon. Add pieces to your bag and leave your email at checkout or in the footer, and we’ll tell you the moment it opens.",
        a: (
          <p>
            Checkout is opening soon. Add pieces to your bag and leave your email at checkout or in
            the footer, and we’ll tell you the moment it opens.
          </p>
        ),
      },
      {
        q: "Do I need an account to order?",
        text: "No. You can check out as a guest. An account lets you keep your details and, soon, see your orders. Sign in with Google or a one-time email link; there are no passwords.",
        a: (
          <p>
            No. You can check out as a guest. An account lets you keep your details and, soon, see
            your orders. Sign in with Google or a one-time email link; there are no passwords.
          </p>
        ),
      },
      {
        q: "Can I change or cancel my order?",
        text: "Each piece is made to order, usually starting within a day. Email us right away and we’ll change or cancel it if it hasn’t gone to print.",
        a: (
          <p>
            Each piece is made to order, usually starting within a day. Email {mail} right away and
            we’ll change or cancel it if it hasn’t gone to print.
          </p>
        ),
      },
      {
        q: "Can my church or ministry order in bulk?",
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
        text: "Every product names its cut. Tees are a regular fit. Oversized tees come in two cuts: regular oversized, wide with a dropped shoulder, and larger oversized, wider and boxier still. The cap is a mid-profile snapback that adjusts at the back. Each product page has a size guide.",
        a: (
          <p>
            Every product names its cut. Tees are a regular fit. Oversized tees come in two cuts:
            regular oversized, wide with a dropped shoulder, and larger oversized, wider and boxier
            still. The cap is a mid-profile snapback that adjusts at the back. Each product page has
            a size guide.
          </p>
        ),
      },
      {
        q: "Should I size down in the oversized tee?",
        text: "Only if you want a closer fit. The oversized cut is meant to sit wide and boxy.",
        a: <p>Only if you want a closer fit. The oversized cut is meant to sit wide and boxy.</p>,
      },
    ],
  },
  {
    title: "Shipping",
    items: [
      {
        q: "How long does delivery take?",
        text: "Pieces are made to order and then shipped. Production and delivery times will be shown at checkout, and you’ll get tracking by email as soon as your order ships.",
        a: (
          <p>
            Pieces are made to order and then shipped. Production and delivery times will be shown
            at checkout, and you’ll get tracking by email as soon as your order ships.
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
    title: "Refunds",
    items: [
      {
        q: "What if my order arrives damaged, misprinted or wrong?",
        text: "Tell us within 30 days of delivery with a photo and we’ll send a replacement or refund you. You usually don’t need to send anything back.",
        a: (
          <p>
            Tell us within 30 days of delivery with a photo and we’ll send a replacement or refund
            you. You usually don’t need to send anything back. The details are in our{" "}
            <Link href="/refunds">refund policy</Link>.
          </p>
        ),
      },
      {
        q: "Can I return something that doesn’t fit?",
        text: "Because every piece is made for you, we can’t take returns for size or a change of mind. Check the size guide before you order, and write to us if you’re unsure.",
        a: (
          <p>
            Because every piece is made for you, we can’t take returns for size or a change of mind.
            Check the size guide before you order, and write to us if you’re unsure.
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
        text: "Out of reverence, we use symbols only: the empty cross, thorns, broken chains, the empty tomb, lilies. The story is his; the art points to it.",
        a: (
          <p>
            Out of reverence, we use symbols only: the empty cross, thorns, broken chains, the empty
            tomb, lilies. The story is his; the art points to it.
          </p>
        ),
      },
      {
        q: "Which Bible translation do you use?",
        text: "Each piece carries a full Scripture reference. When we quote a verse, on a piece or on this site, we use the King James Version (KJV).",
        a: (
          <p>
            Each piece carries a full Scripture reference. When we quote a verse, on a piece or on
            this site, we use the King James Version (KJV).
          </p>
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
        eyebrow="FAQ"
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
