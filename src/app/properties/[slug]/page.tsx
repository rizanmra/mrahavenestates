import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProperty, properties } from "@/data/properties";

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return properties.map((property) => ({ slug: property.slug }));
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = getProperty(slug);
  return { title: property?.title ?? "Property" };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const property = getProperty(slug);

  if (!property) {
    notFound();
  }

  return (
    <section className="px-5 py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/properties"
          className="text-xs tracking-[0.2em] text-[color:var(--muted)] uppercase"
        >
          Back to properties
        </Link>
        <p className="mt-8 text-xs tracking-[0.28em] text-[color:var(--gold)] uppercase">
          {property.status} · {property.location}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl">
          {property.title}
        </h1>
        <p className="mt-6 text-2xl">{property.price}</p>
        <p className="mt-6 text-lg leading-8 text-[color:var(--muted)]">
          {property.summary}
        </p>
        <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-[color:var(--line)] pt-8 text-sm">
          <div>
            <dt className="tracking-[0.14em] text-[color:var(--muted)] uppercase">
              Beds
            </dt>
            <dd className="mt-2 text-lg">{property.beds}</dd>
          </div>
          <div>
            <dt className="tracking-[0.14em] text-[color:var(--muted)] uppercase">
              Baths
            </dt>
            <dd className="mt-2 text-lg">{property.baths}</dd>
          </div>
          <div>
            <dt className="tracking-[0.14em] text-[color:var(--muted)] uppercase">
              Area
            </dt>
            <dd className="mt-2 text-lg">{property.area}</dd>
          </div>
        </dl>
        <Link
          href="/contact"
          className="mt-10 inline-flex rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm tracking-[0.16em] text-[color:var(--cream)] uppercase"
        >
          Enquire about this home
        </Link>
      </div>
    </section>
  );
}
