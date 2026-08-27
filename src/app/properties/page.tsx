import Link from "next/link";
import type { Metadata } from "next";
import { properties } from "@/data/properties";

export const metadata: Metadata = {
  title: "Properties",
};

export default function PropertiesPage() {
  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs tracking-[0.28em] text-[color:var(--gold)] uppercase">
          Listings
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl">
          Properties
        </h1>
        <p className="mt-4 max-w-2xl text-[color:var(--muted)]">
          Sample listings for the first build. Live inventory can move into
          Convex when the client is ready to manage homes from a dashboard.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.slug}
              href={`/properties/${property.slug}`}
              className="border border-[color:var(--line)] bg-white/40 p-6"
            >
              <p className="text-xs tracking-[0.2em] text-[color:var(--gold)] uppercase">
                {property.status}
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl">
                {property.title}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {property.location} · {property.area}
              </p>
              <p className="mt-6 text-lg">{property.price}</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                {property.summary}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
