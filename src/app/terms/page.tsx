import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Website and service terms for ${site.name}.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        These terms apply when you use the {site.name} website and when you
        instruct us for estate agency, lettings, valuation or removal services.
        By using this site you agree to these terms.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Website use</h2>
      <p>
        Content on this site is for general information about our services and
        properties. Listings, prices and availability can change without notice.
        Online calculators (property value, stamp duty and similar tools) give
        estimates only — they are not formal valuations or legal advice.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Accounts</h2>
      <p>
        If you create a client account, you must keep login details secure and
        provide accurate information. You may only view and manage your own
        saved properties and enquiries. We may suspend accounts used
        fraudulently or abusively.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Services</h2>
      <p>
        Specific fees, obligations and timescales for sales, lettings, managed
        services or removals are set out in the written agreement or fee
        schedule for that instruction. Nothing on this website alone creates a
        binding agency contract.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Liability</h2>
      <p>
        We take reasonable care with information on this site, but we do not
        guarantee it is complete or error-free. To the fullest extent permitted
        by law, we are not liable for losses arising from reliance on website
        content alone. Nothing in these terms excludes liability for death or
        personal injury caused by negligence, or for fraud.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">
        Intellectual property
      </h2>
      <p>
        Site design, branding, text and images belong to {site.name} or our
        licensors. You may not copy or republish them without permission,
        except for personal, non-commercial viewing.
      </p>
      <h2 className="pt-4 font-display text-2xl text-white">Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href={`mailto:${site.email}`} className="text-[color:var(--gold)]">
          {site.email}
        </a>{" "}
        or{" "}
        <Link href="/contact?reason=general" className="text-[color:var(--gold)]">
          Contact us
        </Link>
        . Last reviewed: September 2026.
      </p>
    </LegalPage>
  );
}
