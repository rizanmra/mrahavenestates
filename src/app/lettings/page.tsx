import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lettings",
  description:
    "Landlord and tenant lettings services across Bradford. Managed lettings with full compliance.",
};

export default function LettingsPage() {
  return (
    <div className="pt-28">
      <section className="relative h-[50vh] min-h-[400px]">
        <Image
          src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&q=85"
          alt="Property to let"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[color:var(--navy)]/70" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h1 className="font-display text-center text-5xl text-white md:text-7xl">
            Lettings
          </h1>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg leading-relaxed text-[color:var(--muted)]">
            Whether you are a landlord looking for reliable tenants or searching
            for your next rental home, our lettings team provides end-to-end
            support with compliance, referencing, and property management.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="btn-gold px-8 py-3 text-sm font-medium uppercase"
            >
              Book now
            </Link>
            <Link
              href="/properties?type=rent"
              className="btn-outline-gold px-8 py-3 text-sm uppercase"
            >
              View rentals
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
