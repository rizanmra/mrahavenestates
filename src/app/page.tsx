import { FeaturedProperties } from "@/components/FeaturedProperties";
import { HomeContactCta } from "@/components/HomeContactCta";
import { HeroExperience } from "@/components/hero/HeroExperience";
import { RemovalSection } from "@/components/RemovalSection";
import { ServiceCards } from "@/components/ServiceCards";
import { Testimonials } from "@/components/Testimonials";
import { PropertyValueCalculator } from "@/app/property-value-calculator/PropertyValueCalculator";
import { WhyChooseUs } from "@/components/WhyChooseUs";

export default function HomePage() {
  return (
    <>
      <HeroExperience />
      <section
        id="property-value-calculator"
        className="scroll-mt-28 border-t border-[color:var(--line)] px-6 py-16 lg:px-10"
      >
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.35em] text-[color:var(--gold)] uppercase">
            Property value
          </p>
          <h2 className="mt-4 font-display text-4xl text-white md:text-5xl">
            Property value calculator
          </h2>
          <p className="mt-4 text-[color:var(--muted)]">
            Local sold prices from HM Land Registry, turned into a £/m² guide
            for your floor area.
          </p>
          <PropertyValueCalculator />
        </div>
      </section>
      <ServiceCards />
      <WhyChooseUs />
      <FeaturedProperties />
      <RemovalSection />
      <Testimonials />

      <section id="contact-cta" className="border-t border-[color:var(--line)] px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-5xl text-white md:text-6xl">
            Contact
          </h2>
          <HomeContactCta />
        </div>
      </section>
    </>
  );
}
