import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses and protects your personal information.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains how {site.name} (“we”, “us”) handles personal
        information when you use our website, contact us, or use our estate
        agency, lettings, valuation and removal services.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Who we are</h2>
      <p>
        {site.name}, {site.address.line1}, {site.address.line2},{" "}
        {site.address.city}, {site.address.postcode}. Email:{" "}
        <a href={`mailto:${site.email}`} className="text-[color:var(--gold)]">
          {site.email}
        </a>
        . Phone:{" "}
        <a href={site.phoneHref} className="text-[color:var(--gold)]">
          {site.phone}
        </a>
        .
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">
        Information we collect
      </h2>
      <p>We may collect:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Identity and contact details (name, email, phone, postal address)
        </li>
        <li>
          Property details you provide (address, postcode, bedrooms, condition)
        </li>
        <li>
          Account details if you register (saved properties and enquiry history)
        </li>
        <li>
          Messages you send via Contact Us, property enquiry, valuation or
          calculator forms
        </li>
        <li>
          Technical data such as browser type and pages visited (where analytics
          are used)
        </li>
      </ul>
      <h2 className="pt-4 font-display text-2xl text-white">How we use it</h2>
      <p>We use your information to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Respond to enquiries and provide valuations or viewings</li>
        <li>Manage lettings, sales support and related services</li>
        <li>Operate your client account and saved property shortlist</li>
        <li>Meet legal and regulatory obligations for estate agency work</li>
        <li>Improve our website and services</li>
      </ul>
      <h2 className="pt-4 font-display text-2xl text-white">Sharing</h2>
      <p>
        We do not sell your personal data. We may share it with service
        providers who help us run the business (for example email delivery or
        hosting), with solicitors or contractors where needed for a transaction,
        or where the law requires disclosure.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Retention</h2>
      <p>
        We keep personal data only as long as needed for the purpose it was
        collected, including legal and accounting requirements, then delete or
        anonymise it where practical.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Your rights</h2>
      <p>
        Under UK GDPR you may ask to access, correct, delete or restrict your
        data, or object to certain processing. To exercise these rights, contact
        us using the details above or via our{" "}
        <Link href="/contact?reason=general" className="text-[color:var(--gold)]">
          Contact
        </Link>{" "}
        page.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Updates</h2>
      <p>
        We may update this policy from time to time. The version on this page is
        the current one. Last reviewed: September 2026.
      </p>
    </LegalPage>
  );
}
