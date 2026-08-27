import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPropertiesByType, type PropertyType } from "@/data/properties";

export const metadata: Metadata = {
  title: "Properties",
};

type PropertiesPageProps = {
  searchParams: Promise<{
    type?: string;
    location?: string;
    min?: string;
    max?: string;
    beds?: string;
  }>;
};

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const params = await searchParams;
  const type =
    params.type === "sale" || params.type === "rent"
      ? (params.type as PropertyType)
      : undefined;

  let results = getPropertiesByType(type);

  if (params.location) {
    const query = params.location.toLowerCase();
    results = results.filter((property) =>
      property.location.toLowerCase().includes(query),
    );
  }

  if (params.beds) {
    const minBeds = Number(params.beds);
    if (!Number.isNaN(minBeds)) {
      results = results.filter((property) => property.beds >= minBeds);
    }
  }

  return (
    <div className="pt-28">
      <section className="px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-5xl text-white">Properties</h1>
          <p className="mt-4 text-[color:var(--muted)]">
            {type === "sale"
              ? "Homes for sale"
              : type === "rent"
                ? "Properties to rent"
                : "All available properties"}
            {params.location ? ` in ${params.location}` : ""}
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/properties"
              className={`text-sm ${!type ? "text-[color:var(--gold)]" : "text-white"}`}
            >
              All
            </Link>
            <Link
              href="/properties?type=sale"
              className={`text-sm ${type === "sale" ? "text-[color:var(--gold)]" : "text-white"}`}
            >
              Buy
            </Link>
            <Link
              href="/properties?type=rent"
              className={`text-sm ${type === "rent" ? "text-[color:var(--gold)]" : "text-white"}`}
            >
              Rent
            </Link>
          </div>

          {results.length === 0 ? (
            <p className="mt-12 text-[color:var(--muted)]">
              No properties match your search.{" "}
              <Link href="/contact" className="text-[color:var(--gold)]">
                Contact us
              </Link>{" "}
              and we will help you find the right home.
            </p>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {results.map((property) => (
                <Link
                  key={property.slug}
                  href={`/properties/${property.slug}`}
                  className="group overflow-hidden border border-[color:var(--line)]"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={property.image}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs text-[color:var(--gold)]">
                      {property.status}
                    </span>
                    <h2 className="font-display mt-2 text-2xl text-white">
                      {property.title}
                    </h2>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {property.location}
                    </p>
                    <p className="mt-3 text-lg text-white">{property.price}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      {property.beds} bed · {property.baths} bath ·{" "}
                      {property.area}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
