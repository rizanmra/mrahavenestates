import Image from "next/image";
import Link from "next/link";

export function ValuationCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-24 lg:px-10">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=85"
          alt="Luxury property interior"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[color:var(--navy)]/85" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="font-display text-4xl text-white md:text-5xl">
          How much is your property worth?
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">
          Get a free, no-obligation valuation from our local property experts.
          We know the Bradford market inside out.
        </p>
        <Link
          href="/free-valuation"
          className="btn-gold mt-10 inline-block px-10 py-4 text-sm font-medium tracking-wide uppercase"
        >
          Book your property valuation
        </Link>
      </div>
    </section>
  );
}
