import type { Metadata } from "next";
import { InfoBody, PageImageHero } from "@/components/PageTemplate";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "Buy",
  description: "Find your next home with MRA Haven Estates.",
};

export default function BuyPage() {
  return (
    <>
      <PageImageHero
        title="Buy Your Next Home"
        subtitle="Search properties, get expert advice, and move with confidence."
        image={siteImages.buy}
      />
      <InfoBody
        cta={{ label: "Search properties for sale", href: "/properties?type=sale" }}
        bullets={[
          "Dedicated negotiators from offer to completion",
          "Mortgage and conveyancing introductions",
          "Area guides for Bradford and West Yorkshire",
          "Free instant market estimate tool on our homepage",
        ]}
      >
        <p>
          Whether you are a first-time buyer or moving up the ladder, our team
          guides you from property search to completion.
        </p>
        <p>
          Browse our latest homes for sale across Bradford and West Yorkshire,
          or book a viewing with our local experts.
        </p>
      </InfoBody>
    </>
  );
}
