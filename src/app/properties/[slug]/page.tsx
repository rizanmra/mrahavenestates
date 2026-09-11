import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SavePropertyButton } from "@/components/SavePropertyButton";
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
    <div className="pt-28">
      <section className="relative h-[50vh] min-h-[400px]">
        <Image
          src={property.image}
          alt={property.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[color:var(--navy)]/50" />
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/properties"
            className="text-sm text-[color:var(--gold)]"
          >
            ← Back to properties
          </Link>
          <p className="mt-8 text-sm text-[color:var(--gold)]">
            {property.status} · {property.location}
          </p>
          <h1 className="font-display mt-2 text-5xl text-white">
            {property.title}
          </h1>
          <p className="mt-6 text-3xl text-white">{property.price}</p>
          <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">
            {property.summary}
          </p>
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-[color:var(--line)] pt-8">
            <div>
              <dt className="text-xs text-[color:var(--muted)] uppercase">
                Beds
              </dt>
              <dd className="mt-2 text-xl text-white">{property.beds}</dd>
            </div>
            <div>
              <dt className="text-xs text-[color:var(--muted)] uppercase">
                Baths
              </dt>
              <dd className="mt-2 text-xl text-white">{property.baths}</dd>
            </div>
            <div>
              <dt className="text-xs text-[color:var(--muted)] uppercase">
                Area
              </dt>
              <dd className="mt-2 text-xl text-white">{property.area}</dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="btn-gold inline-block px-8 py-3 text-sm font-medium uppercase"
            >
              Enquire about this property
            </Link>
            <SavePropertyButton slug={property.slug} />
          </div>
        </div>
      </section>
    </div>
  );
}
