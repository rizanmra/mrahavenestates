import type { Metadata } from "next";
import { InfoBody, PageImageHero } from "@/components/PageTemplate";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "Rent",
  description: "Find a property to rent with MRA Haven Estates.",
};

export default function RentPage() {
  return (
    <>
      <PageImageHero
        title="Find a Property to Rent"
        subtitle="Quality rental homes nationwide across the UK."
        image={siteImages.rent}
      />
      <InfoBody
        cta={{ label: "Search rentals", href: "/properties?type=rent" }}
        bullets={[
          "Homes to suit every budget and lifestyle",
          "Transparent tenant charges — no hidden fees",
          "Online repair reporting for existing tenants",
          "Contents insurance introductions available",
        ]}
      >
        <p>
          Browse our available rental properties and book viewings with our
          lettings team.
        </p>
        <p>
          From city centre apartments to family homes in Shipley and Bingley, we
          help you find the right place to call home.
        </p>
      </InfoBody>
    </>
  );
}
