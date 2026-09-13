import Image from "next/image";
import Link from "next/link";
import { listProperties } from "@/lib/listings-store";

export async function FeaturedProperties() {
  const featured = (await listProperties()).slice(0, 3);

  return (
    <section className="border-t border-[color:var(--line)] px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm tracking-widest text-[color:var(--gold)] uppercase">
              Featured listings
            </p>
            <h2 className="font-display mt-2 text-4xl text-white md:text-5xl">
              Properties for you
            </h2>
          </div>
          <Link
            href="/properties?type=rent"
            className="hidden text-sm text-[color:var(--gold)] hover:underline md:inline"
          >
            View all properties
          </Link>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {featured.map((property) => (
            <Link
              key={property.slug}
              href={`/properties/${property.slug}`}
              className="group overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={property.image}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--navy)]/80 to-transparent" />
                <span className="absolute top-4 left-4 bg-[color:var(--gold)] px-3 py-1 text-xs font-medium text-[color:var(--navy)]">
                  {property.status}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-display text-2xl text-white group-hover:text-[color:var(--gold)]">
                  {property.title}
                </h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {property.location}
                </p>
                <p className="mt-2 text-lg font-medium text-white">
                  {property.price}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {property.beds} {property.beds === 1 ? "bedroom" : "bedrooms"} ·{" "}
                  {property.baths} {property.baths === 1 ? "bath" : "baths"} ·{" "}
                  {property.area}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
