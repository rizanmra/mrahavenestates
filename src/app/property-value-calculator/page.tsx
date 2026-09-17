import type { Metadata } from "next";
import { InfoBody, PageHero } from "@/components/PageTemplate";
import { PropertyValueCalculator } from "./PropertyValueCalculator";

export const metadata: Metadata = {
  title: "Property Value Calculator",
  description:
    "Estimate local property value from HM Land Registry sold prices: price per square metre × your floor area in square feet.",
};

export default function PropertyValueCalculatorPage() {
  return (
    <>
      <PageHero
        title="Property Value Calculator"
        subtitle="Local sold prices from HM Land Registry, turned into a £/m² guide for your floor area."
      />
      <InfoBody
        cta={{
          label: "Book a valuation visit",
          href: "/contact?reason=valuation",
        }}
      >
        <p>
          Enter a postcode, property type and floor area. We pull recent free
          HM Land Registry sold prices for the area, derive a local price per
          square metre, then multiply by the size you enter.
        </p>
        <PropertyValueCalculator />
      </InfoBody>
    </>
  );
}
