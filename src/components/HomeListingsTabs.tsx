"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { siteImages } from "@/data/hero-images";
import type { Property } from "@/data/properties";

type Tab = "sale" | "rent" | "conveyancing" | "mortgages" | "removals";

const tabs: { id: Tab; label: string }[] = [
  { id: "sale", label: "Properties for sale" },
  { id: "rent", label: "Properties for rent" },
  { id: "conveyancing", label: "Conveyancing" },
  { id: "mortgages", label: "Mortgages" },
  { id: "removals", label: "Removals" },
];

export function HomeListingsTabs({
  saleProperties,
  rentProperties,
}: {
  saleProperties: Property[];
  rentProperties: Property[];
}) {
  const [tab, setTab] = useState<Tab>("sale");

  return (
    <section className="border-t border-[color:var(--line)] px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm tracking-widest text-[color:var(--gold)] uppercase">
          Featured
        </p>
        <div
          role="tablist"
          aria-label="Homepage listings"
          className="mt-6 flex w-full items-stretch border-b border-[color:var(--line)]"
        >
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`flex min-h-[4.25rem] flex-1 items-center justify-center px-1 py-3 text-center text-[10px] leading-tight tracking-wide uppercase transition-colors sm:px-2 sm:text-xs md:min-h-[3.75rem] md:text-sm ${
                  active
                    ? "-mb-px border-b-2 border-[color:var(--gold)] text-[color:var(--gold)]"
                    : "text-[color:var(--muted)] hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "sale" ? (
          <PropertyGrid
            properties={saleProperties}
            empty="No homes for sale are listed right now."
            viewAllHref="/properties?type=sale"
            viewAllLabel="View all sales"
          />
        ) : null}

        {tab === "rent" ? (
          <PropertyGrid
            properties={rentProperties}
            empty="No homes to rent are listed right now."
            viewAllHref="/properties?type=rent"
            viewAllLabel="View all lettings"
          />
        ) : null}

        {tab === "conveyancing" ? (
          <ServiceQuotePanel
            title="Conveyancing"
            copy="Trusted solicitors for a smooth sale or purchase — from instruction through to completion."
            image={siteImages.conveyancing}
            imageAlt="Conveyancing and property legal services"
            quoteHref="/contact?reason=conveyancing"
            quoteLabel="Get a quote"
            moreHref="/conveyancing"
            moreLabel="Find out more"
          />
        ) : null}

        {tab === "mortgages" ? (
          <ServiceQuotePanel
            title="Mortgages"
            copy="Whole-of-market advice for first-time buyers, movers, remortgages and buy-to-let landlords."
            image={siteImages.mortgages}
            imageAlt="Mortgage advice"
            quoteHref="/contact?reason=mortgage"
            quoteLabel="Get a quote"
            moreHref="/mortgages"
            moreLabel="Find out more"
          />
        ) : null}

        {tab === "removals" ? (
          <ServiceQuotePanel
            title="Removals"
            copy="Licensed packing and removals across Bradford and West Yorkshire — from studio flats to full family moves."
            image={siteImages.removals}
            imageAlt="Removal and packing services"
            quoteHref="/contact?reason=removals"
            quoteLabel="Get a quote"
            moreHref="/removal-services"
            moreLabel="Find out more"
          />
        ) : null}
      </div>
    </section>
  );
}

function PropertyGrid({
  properties,
  empty,
  viewAllHref,
  viewAllLabel,
}: {
  properties: Property[];
  empty: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  if (properties.length === 0) {
    return (
      <p className="mt-12 text-lg text-[color:var(--muted)]">
        {empty}{" "}
        <Link href="/contact" className="text-[color:var(--gold)]">
          Contact us
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {properties.map((property) => (
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
      <div className="mt-10 text-center">
        <Link
          href={viewAllHref}
          className="text-sm text-[color:var(--gold)] hover:underline"
        >
          {viewAllLabel}
        </Link>
      </div>
    </>
  );
}

function ServiceQuotePanel({
  title,
  copy,
  image,
  imageAlt,
  quoteHref,
  quoteLabel,
  moreHref,
  moreLabel,
}: {
  title: string;
  copy: string;
  image: string;
  imageAlt: string;
  quoteHref: string;
  quoteLabel: string;
  moreHref: string;
  moreLabel: string;
}) {
  return (
    <div className="relative mt-12 min-h-[380px] overflow-hidden border border-[color:var(--line)] md:min-h-[440px]">
      <Image
        src={image}
        alt={imageAlt}
        fill
        className="object-cover"
        sizes="(max-width: 1200px) 100vw, 1152px"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[color:var(--navy)]/90 via-[color:var(--navy)]/55 to-[color:var(--navy)]/25" />
      <div className="relative z-10 flex min-h-[380px] flex-col justify-between p-6 md:min-h-[440px] md:p-10">
        <div className="flex justify-end">
          <Link
            href={quoteHref}
            className="btn-gold px-6 py-3 text-xs font-medium tracking-wide uppercase"
          >
            {quoteLabel}
          </Link>
        </div>
        <div>
          <h3 className="font-display text-4xl text-white md:text-5xl">{title}</h3>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            {copy}
          </p>
          <Link
            href={moreHref}
            className="btn-outline-gold mt-8 inline-block w-fit px-8 py-3 text-sm uppercase"
          >
            {moreLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
