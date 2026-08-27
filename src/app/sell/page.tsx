import type { Metadata } from "next";
import { InfoBody, PageImageHero } from "@/components/PageTemplate";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "Sell",
  description: "Sell your property with MRA Haven Estates.",
};

export default function SellPage() {
  return (
    <>
      <PageImageHero
        title="Sell Your Property"
        subtitle="Premium marketing, expert valuations, and a smooth sale from start to finish."
        image={siteImages.sales}
      />
      <InfoBody
        cta={{ label: "Book free valuation", href: "/free-valuation" }}
        bullets={[
          "Professional photography and video tours",
          "Rightmove and Zoopla premium listings",
          "Regular viewing feedback and price strategy",
          "Auction route available for swift sales",
        ]}
      >
        <p>
          We market your home with professional photography, targeted reach, and
          honest local advice to achieve the best result.
        </p>
        <p>
          Our negotiators handle offers, surveys, and exchange — keeping you
          informed at every stage until completion day.
        </p>
      </InfoBody>
    </>
  );
}
