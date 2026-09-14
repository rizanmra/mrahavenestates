import { FeaturedProperties } from "@/components/FeaturedProperties";
import { HomeContactCta } from "@/components/HomeContactCta";
import { HeroExperience } from "@/components/hero/HeroExperience";
import { RemovalSection } from "@/components/RemovalSection";
import { ServiceCards } from "@/components/ServiceCards";
import { Testimonials } from "@/components/Testimonials";
import FreeValuationForm from "@/app/free-valuation/FreeValuationForm";
import { WhyChooseUs } from "@/components/WhyChooseUs";

export default function HomePage() {
  return (
    <>
      <HeroExperience />
      <FreeValuationForm embedded />
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
