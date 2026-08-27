import Link from "next/link";
import { properties } from "@/data/properties";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden px-5">
        <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end pb-16 pt-24">
          <p className="text-xs tracking-[0.35em] text-[color:var(--gold)] uppercase">
            Private residential estates
          </p>
          <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-[1.05] font-medium tracking-tight md:text-7xl">
            Homes with quiet presence.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[color:var(--muted)]">
            MRA Haven Estates is a custom property website — built to last,
            owned by the client, and ready for listings, enquiries, and a
            connected domain.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/properties"
              className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm tracking-[0.16em] text-[color:var(--cream)] uppercase"
            >
              View properties
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-[color:var(--ink)] px-6 py-3 text-sm tracking-[0.16em] uppercase"
            >
              Book a viewing
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[color:var(--line)] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.28em] text-[color:var(--gold)] uppercase">
                Selected homes
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
                Current collection
              </h2>
            </div>
            <Link
              href="/properties"
              className="hidden text-sm tracking-[0.14em] uppercase md:inline"
            >
              All properties
            </Link>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {properties.map((property) => (
              <Link
                key={property.slug}
                href={`/properties/${property.slug}`}
                className="group"
              >
                <div className="aspect-[4/5] rounded-sm bg-[linear-gradient(160deg,#2a3b33,#1c2a24)] p-6 text-[color:var(--cream)]">
                  <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--gold)]">
                    {property.status}
                  </p>
                  <p className="mt-auto pt-40 font-[family-name:var(--font-display)] text-3xl">
                    {property.title}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-sm tracking-[0.12em] text-[color:var(--muted)] uppercase">
                    {property.location}
                  </p>
                  <p className="mt-1 text-lg">{property.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
