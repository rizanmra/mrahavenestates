import type { Metadata } from "next";
import { InfoBody, PageImageHero } from "@/components/PageTemplate";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "Mortgages",
  description: "Mortgage advice from MRA Haven Estates.",
};

export default function MortgagesPage() {
  return (
    <>
      <PageImageHero
        title="Mortgages"
        subtitle="Expert mortgage advice for buyers and landlords."
        image={siteImages.mortgages}
      />
      <InfoBody
        cta={{ label: "Get in touch", href: "/contact" }}
        bullets={[
          "Whole-of-market broker introductions",
          "First-time buyer and remortgage support",
          "Buy-to-let finance for landlords",
          "Clear affordability guidance before you offer",
        ]}
      >
        <p>
          Choosing the right mortgage is one of the most important decisions in
          your property journey. We introduce you to trusted advisors who search
          the market for competitive rates.
        </p>
        <p>
          Whether you are purchasing your first home, moving, or expanding a
          rental portfolio, our partners explain your options in plain English.
        </p>
      </InfoBody>
    </>
  );
}
