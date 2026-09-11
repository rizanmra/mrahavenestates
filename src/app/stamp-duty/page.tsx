import type { Metadata } from "next";
import { InfoBody, PageHero } from "@/components/PageTemplate";
import { StampDutyCalculator } from "./StampDutyCalculator";

export const metadata: Metadata = {
  title: "Stamp Duty Calculator",
  description: "Calculate stamp duty on your property purchase.",
};

export default function StampDutyPage() {
  return (
    <>
      <PageHero
        title="Stamp Duty Calculator"
        subtitle="A quick England & Northern Ireland SDLT estimate."
      />
      <InfoBody cta={{ label: "Speak to an advisor", href: "/contact" }}>
        <p>
          Use this guide to estimate Stamp Duty Land Tax on a residential
          purchase. Rates can change and additional surcharges may apply.
        </p>
        <StampDutyCalculator />
      </InfoBody>
    </>
  );
}
