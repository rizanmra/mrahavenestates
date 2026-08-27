import type { Metadata } from "next";
import Image from "next/image";
import { PageImageHero } from "@/components/PageTemplate";
import { Testimonials } from "@/components/Testimonials";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <>
      <PageImageHero
        title="About MRA Haven Estates"
        subtitle="Helping people move across Bradford and West Yorkshire."
        image={siteImages.about}
      />
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="space-y-6 text-lg leading-relaxed text-[color:var(--muted)]">
            <p>
              MRA Haven Estates is a trusted estate agent offering sales,
              lettings, removals and valuations under one roof.
            </p>
            <p>
              From premium property marketing and managed lettings to licensed
              removals and free valuations, we offer a complete moving solution.
            </p>
            <p>
              Based in Bradford, we know our local market inside out — and we
              are proud to support the communities we serve.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={siteImages.about}
              alt="MRA Haven Estates office"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
      <Testimonials />
    </>
  );
}
