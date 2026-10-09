import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/features/legal/legal-page";
import { LEGAL, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms for using the Awebound website and buying from the store.",
  alternates: { canonical: "/terms" },
};

const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement",
    body: (
      <p>
        These terms apply when you use this website or buy from {LEGAL.businessName}. By using the
        site you agree to them. If you don’t agree, please don’t use the site.
      </p>
    ),
  },
  {
    id: "orders",
    title: "Orders and pricing",
    body: (
      <>
        <p>
          Prices are shown in US dollars and may change. An order is accepted when we confirm it by
          email. If an item was listed at the wrong price or is unavailable, we’ll tell you and you
          can cancel for a full refund.
        </p>
        <p>Taxes and shipping are calculated at checkout.</p>
      </>
    ),
  },
  {
    id: "made-to-order",
    title: "Made to order",
    body: (
      <p>
        Each piece is printed or embroidered after you order it. Colors on screen can differ
        slightly from the finished garment, and small variations in placement are part of how
        made-to-order apparel is produced.
      </p>
    ),
  },
  {
    id: "shipping-refunds",
    title: "Shipping, refunds and replacements",
    body: (
      <p>
        Delivery estimates are shown at checkout and in the <Link href="/faq">FAQ</Link>.
        Replacements and refunds follow our <Link href="/refunds">refund policy</Link>.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    body: (
      <p>
        You can sign in with Google or with a one-time link or code sent to your email. Keep access
        to that email account secure; you’re responsible for activity on your Awebound account. We
        may suspend accounts used to abuse the store.
      </p>
    ),
  },
  {
    id: "use",
    title: "Using the site",
    body: (
      <ul>
        <li>
          Don’t misuse the site, interfere with its operation or try to access it in ways we don’t
          provide.
        </li>
        <li>Don’t submit unlawful, abusive or misleading content through our forms.</li>
        <li>
          Don’t resell our products in a way that suggests you are Awebound or an official partner.
        </li>
      </ul>
    ),
  },
  {
    id: "ip",
    title: "Our designs and marks",
    body: (
      <>
        <p>
          The Awebound name, the A3 Thornbound wordmark, the Thorn Cross, our artwork, product
          photos and site content belong to {LEGAL.businessName}. You may not copy or use them
          commercially without written permission.
        </p>
        <p>
          Scripture quotations are from the King James Version (KJV), which is in the public domain
          in the United States.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        The site is provided as is. We work to keep it accurate and available, but we don’t promise
        it will be error-free or uninterrupted. Nothing in these terms limits rights you have under
        consumer protection law.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the extent the law allows, our total liability for any claim related to an order is
        limited to the amount you paid for that order, and we aren’t liable for indirect or
        consequential losses.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of{" "}
        {LEGAL.governingLaw ?? "the state in which Awebound is organized"} and the United States,
        without regard to conflict-of-law rules.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <p>
        We may update these terms and will note the date at the top of the page. Questions go to{" "}
        {mail}. See also our <Link href="/privacy">privacy policy</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      current="/terms"
      intro="The plain terms for using this site and buying from Awebound."
      sections={sections}
    />
  );
}
