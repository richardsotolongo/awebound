import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/features/legal/legal-page";
import { LEGAL, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Awebound collects, why, who helps us run the store, and the choices you have.",
  alternates: { canonical: "/privacy" },
};

const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <p>
        {LEGAL.businessName} (“Awebound”, “we”) runs this website and store. This policy explains
        what personal information we collect, how we use it and the choices you have. Questions go
        to {mail}.
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Drop notes and notify requests:</strong> your email address.
          </li>
          <li>
            <strong>Contact form:</strong> your name, email, topic and message.
          </li>
          <li>
            <strong>Account:</strong> if you sign in with Google, your name, email and profile
            picture from Google; if you sign in by email, your email address. We never ask for or
            store a password.
          </li>
          <li>
            <strong>Orders</strong> (once checkout opens): your name, shipping address, email, phone
            if given, and what you ordered. Payment details are handled by our payment provider; we
            never see or store full card numbers.
          </li>
        </ul>
        <h3>Information collected automatically</h3>
        <ul>
          <li>
            <strong>Essential cookies</strong> that keep you signed in. We don’t use advertising
            cookies or cross-site trackers.
          </li>
          <li>
            <strong>Your bag</strong> is saved in your own browser’s local storage so it’s there
            when you return.
          </li>
          <li>
            <strong>Server logs</strong> such as IP address, browser type and pages requested, used
            to keep the site secure and to limit abuse.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <ul>
        <li>To answer your messages and provide customer support.</li>
        <li>To send drop notes and the notices you asked for. You can stop them at any time.</li>
        <li>
          To run your account and, once checkout opens, to make, ship and support your orders.
        </li>
        <li>To keep the store secure, prevent fraud and spam, and fix problems.</li>
        <li>To meet legal, tax and accounting obligations.</li>
      </ul>
    ),
  },
  {
    id: "share",
    title: "Who we share it with",
    body: (
      <>
        <p>
          We don’t sell or rent your personal information. We share it only with service providers
          who help us run the store:
        </p>
        <ul>
          <li>Supabase, for our database and sign-in.</li>
          <li>Resend, to deliver email.</li>
          <li>Google, if you choose to sign in with Google.</li>
          <li>Our website and server hosting providers.</li>
          <li>
            Once checkout opens, our commerce, payment and print-on-demand partners, to take payment
            and make and ship your order.
          </li>
        </ul>
        <p>
          We may also disclose information when the law requires it or to protect the rights and
          safety of our customers.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <p>
        We keep information only as long as we need it for the purposes above: drop-note addresses
        until you unsubscribe, messages for as long as needed to help you, and order records for as
        long as tax and accounting rules require.
      </p>
    ),
  },
  {
    id: "choices",
    title: "Your choices and rights",
    body: (
      <>
        <p>
          You can stop drop notes at any time by replying to any of them or writing to us. You can
          delete your account yourself on your account page; that removes your sign-in, your profile
          and your drop-notes subscription. You can also ask us to show you, correct or delete the
          personal information we hold about you by writing to {mail}. Depending on where you live,
          you may have further rights under local law; we’ll honor them.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        This store is not directed to children under 13, and we don’t knowingly collect their
        information.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use encrypted connections, restrict access to the people and services that need it, and
        never store passwords. No system is perfectly secure, so if you suspect a problem with your
        account, tell us right away.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We’ll update this page when our practices change and note the date at the top. Significant
        changes will be announced by email or on the site. See also our{" "}
        <Link href="/terms">terms</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      current="/privacy"
      intro="We collect only what we need to answer you, run your account and send your order. We never sell it."
      sections={sections}
    />
  );
}
