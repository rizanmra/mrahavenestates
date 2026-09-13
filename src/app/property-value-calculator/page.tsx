import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageTemplate";
import { PropertyValueCalculator } from "./PropertyValueCalculator";

export const metadata: Metadata = {
  title: "How Much Is My House Worth? | Free Property Value Calculator",
  description:
    "Enter your address and get a free estimated market value for homes in Bradford and West Yorkshire. Instant online house price calculator — then book a free valuation.",
  keywords: [
    "how much is my house worth",
    "property value calculator",
    "house price estimate by address",
    "estimated market value Bradford",
    "free house valuation",
    "property valuation West Yorkshire",
    "what is my house worth",
  ],
  openGraph: {
    title: "How Much Is My House Worth? | MRA Haven Estates",
    description:
      "Enter your address for an instant estimated market value. Soft opt-in, then book a free valuation with our Bradford team.",
    type: "website",
  },
};

export default function PropertyValueCalculatorPage() {
  return (
    <>
      <PageHero
        title="How much is my house worth?"
        subtitle="Enter your address for a free estimated market value — then unlock it with your email."
      />
      <section className="px-6 py-16 lg:px-10">
        <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-[color:var(--muted)]">
          Looking for a rough <strong>estimated market value</strong>? Enter your
          property address and details. We&apos;ll give you an indicative range
          for Bradford &amp; West Yorkshire. Enter your email to unlock the
          figure — a soft opt-in so we can help if you want a free in-person
          valuation.
        </p>

        {/* Wide enough for 2 columns on large screens; stacks below lg */}
        <div className="mx-auto mt-10 max-w-6xl">
          <PropertyValueCalculator />
        </div>

        <div className="mx-auto mt-16 max-w-3xl space-y-4 text-center text-sm leading-relaxed text-[color:var(--muted)]">
          <h2 className="font-display text-2xl text-white">
            Why homeowners use this calculator
          </h2>
          <p>
            People searching &quot;how much is my house worth&quot; want a quick
            answer before speaking to an agent. This tool gives a rough estimate
            from your address and postcode area — then a clear next step to book
            a free accurate valuation with MRA Haven Estates.
          </p>
          <h2 className="font-display text-2xl text-white">Areas we cover</h2>
          <p>
            Bradford (BD), Leeds (LS), Halifax (HX), Huddersfield (HD), Wakefield
            (WF) and surrounding West Yorkshire postcodes. Call{" "}
            <Link href="/branches" className="text-[color:var(--gold)]">
              our branch
            </Link>{" "}
            if you&apos;re unsure whether we cover your street.
          </p>
          <Link
            href="/free-valuation"
            className="btn-gold mt-8 inline-block px-8 py-3 text-sm uppercase"
          >
            Book a free valuation
          </Link>
        </div>
      </section>
    </>
  );
}
