import type { Metadata } from "next";
import { InfoBody, PageHero } from "@/components/PageTemplate";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Find Your Local Branch",
  description: "MRA Haven Estates branch in Bradford.",
};

export default function BranchesPage() {
  return (
    <>
      <PageHero title="Find Your Local Branch" />
      <InfoBody cta={{ label: "Contact branch", href: "/contact" }}>
        <p>
          <strong className="text-white">{site.name}</strong>
          <br />
          {site.address.line1}
          <br />
          {site.address.line2}
          <br />
          {site.address.city}, {site.address.postcode}
          <br />
          <br />
          Phone: {site.phone}
          <br />
          Email: {site.email}
        </p>
      </InfoBody>
    </>
  );
}
