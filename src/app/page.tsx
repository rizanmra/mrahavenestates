import { FeaturedProperties } from "@/components/FeaturedProperties";
import { HeroExperience } from "@/components/hero/HeroExperience";
import { RemovalSection } from "@/components/RemovalSection";
import { ServiceCards } from "@/components/ServiceCards";
import { Testimonials } from "@/components/Testimonials";
import { ValuationCTA } from "@/components/ValuationCTA";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { site } from "@/data/site";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <HeroExperience />
      <ServiceCards />
      <WhyChooseUs />
      <FeaturedProperties />
      <ValuationCTA />
      <RemovalSection />
      <Testimonials />

      <section id="contact-cta" className="border-t border-[color:var(--line)] px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-5xl text-white md:text-6xl">
            Contact
          </h2>
          <p className="mt-6 text-lg text-[color:var(--muted)]">
            Ready to move? Speak to our team today on{" "}
            <a href={site.phoneHref} className="text-[color:var(--gold)]">
              {site.phone}
            </a>
            .
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="btn-outline-gold inline-block px-10 py-4 text-sm tracking-wide uppercase"
            >
              Get in touch
            </Link>
            <Link
              href="/login"
              className="btn-gold inline-block px-10 py-4 text-sm tracking-wide uppercase"
            >
              Client login
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
