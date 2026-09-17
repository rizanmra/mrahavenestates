import type { Metadata } from "next";
import Link from "next/link";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertiesEmptyCopy } from "@/components/PropertiesEmptyCopy";
import { getPropertiesByType } from "@/lib/listings-store";
import type { PropertyType } from "@/data/properties";

export const dynamic = "force-dynamic";

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

function buildTypeHref(
  type: PropertyType,
  params: { location?: string; beds?: string; min?: string; max?: string },
) {
  const query = new URLSearchParams();
  query.set("type", type);
  if (params.location?.trim()) query.set("location", params.location.trim());
  if (params.beds?.trim()) query.set("beds", params.beds.trim());
  if (params.min?.trim()) query.set("min", params.min.trim());
  if (params.max?.trim()) query.set("max", params.max.trim());
  return `/properties?${query.toString()}`;
}

export default async function PropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const params = await searchParams;
  const type: PropertyType = params.type === "sale" ? "sale" : "rent";
  const forSale = type === "sale";

  let results = await getPropertiesByType(type);

  if (params.location) {
    const query = params.location.toLowerCase();
    results = results.filter(
      (property) =>
        property.location.toLowerCase().includes(query) ||
        property.title.toLowerCase().includes(query),
    );
  }

  if (params.beds) {
    const minBeds = Number(params.beds);
    if (!Number.isNaN(minBeds)) {
      results = results.filter((property) => property.beds >= minBeds);
    }
  }

  const locationLabel = params.location?.trim() || "";
  const rentHref = buildTypeHref("rent", params);
  const saleHref = buildTypeHref("sale", params);

  return (
    <div className="page-offset">
      <section className="px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-5xl text-white">
            {forSale ? "Properties for sale" : "Properties to rent"}
          </h1>
          <p className="mt-4 text-[color:var(--muted)]">
            {locationLabel
              ? `Results for “${locationLabel}”`
              : forSale
                ? "Homes for sale nationwide across the UK"
                : "Homes available to rent nationwide across the UK"}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href={rentHref}
              className={`px-5 py-3 text-sm uppercase tracking-wide ${
                !forSale
                  ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                  : "border border-[color:var(--line)] text-white hover:border-[color:var(--gold)]"
              }`}
            >
              Rent
            </Link>
            <Link
              href={saleHref}
              className={`px-5 py-3 text-sm uppercase tracking-wide ${
                forSale
                  ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                  : "border border-[color:var(--line)] text-white hover:border-[color:var(--gold)]"
              }`}
            >
              Buy
            </Link>
          </div>

          {results.length === 0 ? (
            <PropertiesEmptyCopy
              locationLabel={locationLabel}
              contactHref={
                forSale ? "/contact?reason=sales" : "/contact?reason=lettings"
              }
            />
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {results.map((property) => (
                <PropertyCard key={property.slug} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
