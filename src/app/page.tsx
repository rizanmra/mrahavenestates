import { HeroExperience } from "@/components/hero/HeroExperience";
import { ServiceCards } from "@/components/ServiceCards";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { RemovalSection } from "@/components/RemovalSection";
import { FeaturedProperties } from "@/components/FeaturedProperties";
import { Testimonials } from "@/components/Testimonials";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <HeroExperience />
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
          <p className="mt-6 text-lg text-[color:var(--muted)]">
            Ready to move? Speak to our team today.
          </p>
          <Link
            href="/contact"
            className="btn-outline-gold mt-10 inline-block px-10 py-4 text-sm tracking-wide uppercase"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}
