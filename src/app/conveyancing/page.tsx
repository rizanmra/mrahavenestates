import type { Metadata } from "next";
import { InfoBody, PageImageHero } from "@/components/PageTemplate";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "Conveyancing",
  description: "Conveyancing services with MRA Haven Estates.",
};

export default function ConveyancingPage() {
  return (
    <>
      <PageImageHero
        title="Conveyancing"
        subtitle="Trusted solicitors for a smooth legal completion."
        image={siteImages.conveyancing}
      />
      <InfoBody
        cta={{ label: "Get a conveyancing quote", href: "/contact?reason=conveyancing" }}
        bullets={[
          "Sale and purchase conveyancing referrals",
          "Fixed-fee quotes where possible",
          "Regular progress updates",
          "Auction and new-build specialists available",
        ]}
      >
        <p>
          Conveyancing is the legal process of transferring property ownership.
          We work with experienced solicitors who keep your transaction on track
          from instruction to completion.
        </p>
        <p>
          Ask our team for an introduction when you sell, buy, or remortgage —
          many clients complete faster with solicitors who know our sales process.
        </p>
      </InfoBody>
    </>
  );
}
