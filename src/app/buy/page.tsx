import type { Metadata } from "next";
import Link from "next/link";
import { InfoBody, PageHero } from "@/components/PageTemplate";

export const metadata: Metadata = {
  title: "Buy a Property",
  description:
    "MRA Haven Estates currently focuses on lettings. Browse homes to rent nationwide across the UK.",
};

/** Honest landing page — we do not offer a sales catalogue for buyers. */
export default function BuyPage() {
  return (
    <>
      <PageHero
        title="Buying with MRA Haven Estates"
        subtitle="Our live catalogue is homes to rent — not properties for sale."
      />
      <InfoBody
        cta={{
          label: "Browse homes to rent",
          href: "/properties?type=rent",
        }}
      >
        <p>
          We specialise in lettings nationwide across the UK. If you
          are looking for a place to live, you can search our current rental
          listings and enquire about a specific property.
        </p>
        <p>
          Thinking of selling instead? See{" "}
          <Link href="/sell" className="text-[color:var(--gold)]">
            Sell your property
          </Link>{" "}
          or book a{" "}
          <Link href="/free-valuation" className="text-[color:var(--gold)]">
            free valuation
          </Link>
          .
        </p>
      </InfoBody>
    </>
  );
}
