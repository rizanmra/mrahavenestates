import type { Metadata } from "next";
import { InfoBody, PageHero } from "@/components/PageTemplate";

export const metadata: Metadata = {
  title: "Stamp Duty Calculator",
  description: "Calculate stamp duty on your property purchase.",
};

export default function StampDutyPage() {
  return (
    <>
      <PageHero title="Stamp Duty Calculator" />
      <InfoBody cta={{ label: "Speak to an advisor", href: "/contact" }}>
        <p>Interactive calculator coming soon. Contact us for personalised advice.</p>
      </InfoBody>
    </>
  );
}
