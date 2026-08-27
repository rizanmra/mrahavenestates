import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales",
  description:
    "Sell your property with MRA Haven Estates. Expert marketing, valuations and sales across Bradford.",
};

export default function SalesPage() {
  return (
    <div className="pt-28">
      <section className="relative h-[50vh] min-h-[400px]">
        <Image
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=85"
          alt="Property for sale"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[color:var(--navy)]/70" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h1 className="font-display text-center text-5xl text-white md:text-7xl">
            Sales
          </h1>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg leading-relaxed text-[color:var(--muted)]">
            From first valuation to completion, our sales team guides you
            through every step. Premium photography, targeted marketing, and
            local market expertise across Bradford and West Yorkshire.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/free-valuation"
              className="btn-gold px-8 py-3 text-sm font-medium uppercase"
            >
              Free valuation
            </Link>
            <Link
              href="/properties?type=sale"
              className="btn-outline-gold px-8 py-3 text-sm uppercase"
            >
              View homes for sale
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
