import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { RemovalSection } from "@/components/RemovalSection";
import { siteImages } from "@/data/hero-images";

export const metadata: Metadata = {
  title: "Removal Services",
  description:
    "Licensed removal and packing services across Bradford. From £50. Fully certified team.",
};

export default function RemovalServicesPage() {
  return (
    <div className="pt-28">
      <section className="relative h-[50vh] min-h-[400px]">
        <Image
          src={siteImages.removals}
          alt="Removal services"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--navy)] via-[color:var(--navy)]/60 to-[color:var(--navy)]/30" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h1 className="font-display text-center text-5xl text-white md:text-7xl">
            Removal Services
          </h1>
        </div>
      </section>

      <RemovalSection />

      <section className="px-6 pb-24 text-center lg:px-10">
        <p className="text-3xl text-white">From £50</p>
        <Link
          href="/contact"
          className="btn-gold mt-8 inline-block px-10 py-4 text-sm font-medium uppercase"
        >
          Get a quote
        </Link>
      </section>
    </div>
  );
}
