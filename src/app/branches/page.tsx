import type { Metadata } from "next";
import Link from "next/link";
import { InfoBody, PageHero } from "@/components/PageTemplate";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Find Your Local Branch",
  description: `Visit or contact the ${site.name} branch in Bradford.`,
};

export default function BranchesPage() {
  return (
    <>
      <PageHero
        title="Find Your Local Branch"
        subtitle="Visit us in Bradford or get in touch by phone or email."
      />
      <InfoBody cta={{ label: "Contact our branch", href: "/contact?reason=general" }}>
        <p>
          <strong className="text-white">{site.name}</strong>
        </p>
        <p>
          {site.address.line1}
          <br />
          {site.address.line2}
          <br />
          {site.address.city}, {site.address.postcode}
        </p>
        <p>
          Phone:{" "}
          <a
            href={site.phoneHref}
            className="text-white hover:text-[color:var(--gold)]"
          >
            {site.phone}
          </a>
          <br />
          Email:{" "}
          <a
            href={`mailto:${site.email}`}
            className="text-white hover:text-[color:var(--gold)]"
          >
            {site.email}
          </a>
        </p>
        <p>
          Our team can help with lettings, valuations, landlord services,
          conveyancing introductions, mortgages and removals. Prefer to write
          online? Use{" "}
          <Link href="/contact?reason=general" className="text-[color:var(--gold)]">
            Contact us
          </Link>
          .
        </p>
      </InfoBody>
    </>
  );
}
