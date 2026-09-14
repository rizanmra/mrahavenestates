import type { Metadata } from "next";
import { InfoBody, PageImageHero } from "@/components/PageTemplate";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "Landlords",
  description: "Let your property with MRA Haven Estates.",
};

export default function LandlordsPage() {
  return (
    <>
      <PageImageHero
        title="Landlords"
        subtitle="Fully managed lettings, marketing, and landlord support."
        image={siteImages.landlords}
      />
      <InfoBody
        cta={{ label: "Speak to our lettings team", href: "/contact?reason=lettings" }}
        bullets={[
          "Tenant find, rent collection, or fully managed",
          "Compliance handled — gas, electric, EPC, deposits",
          "Landlord insurance and rent cover introductions",
          "Transparent fee schedule published upfront",
        ]}
      >
        <p>
          From tenant find to full management, we help landlords maximise
          returns while staying compliant.
        </p>
        <p>
          Our property managers act quickly on maintenance, conduct regular
          inspections, and keep you updated with clear monthly statements.
        </p>
      </InfoBody>
    </>
  );
}
