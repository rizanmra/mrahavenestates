import type { Metadata } from "next";
import Link from "next/link";
import { InfoBody, PageHero } from "@/components/PageTemplate";
import { PropertyValueCalculator } from "@/app/property-value-calculator/PropertyValueCalculator";

export const metadata: Metadata = {
  title: "Property Value Calculator",
  description:
    "Estimate local property value from HM Land Registry sold prices.",
};

/** Former stamp-duty route now hosts the site’s property value calculator. */
export default function StampDutyPage() {
  return (
    <>
      <PageHero
        title="Property Value Calculator"
        subtitle="Local sold prices from HM Land Registry, turned into a £/m² guide for your floor area."
      />
      <InfoBody
        cta={{
          label: "Open full calculator page",
          href: "/property-value-calculator",
        }}
      >
        <p>
          This calculator uses HM Land Registry sold prices to estimate value
          from price per square metre × your floor area.{" "}
          <Link href="/property-value-calculator" className="text-[color:var(--gold)]">
            Open the dedicated calculator page
          </Link>
          .
        </p>
        <PropertyValueCalculator />
      </InfoBody>
    </>
  );
}
