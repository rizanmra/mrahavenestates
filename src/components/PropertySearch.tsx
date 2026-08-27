"use client";

import { useState } from "react";
import Link from "next/link";

type SearchType = "buy" | "rent";

export function PropertySearch() {
  const [type, setType] = useState<SearchType>("buy");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [beds, setBeds] = useState("");

  const searchHref = `/properties?type=${type === "buy" ? "sale" : "rent"}${location ? `&location=${encodeURIComponent(location)}` : ""}${minPrice ? `&min=${minPrice}` : ""}${maxPrice ? `&max=${maxPrice}` : ""}${beds ? `&beds=${beds}` : ""}`;

  return (
    <section className="relative z-20 -mt-20 px-6 lg:px-10">
      <div className="mx-auto max-w-4xl rounded-sm border border-[color:var(--line)] bg-[color:var(--navy-light)] p-8 shadow-2xl">
        <h2 className="font-display text-center text-3xl text-white md:text-4xl">
          Find your perfect home
        </h2>

        <div className="mt-8 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setType("buy")}
            className={`px-8 py-3 text-sm font-medium transition-colors ${
              type === "buy"
                ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                : "border border-[color:var(--line)] text-white hover:border-[color:var(--gold)]"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setType("rent")}
            className={`px-8 py-3 text-sm font-medium transition-colors ${
              type === "rent"
                ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                : "border border-[color:var(--line)] text-white hover:border-[color:var(--gold)]"
            }`}
          >
            Rent
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs text-[color:var(--muted)]">
              Location
            </span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bradford"
              className="w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none placeholder:text-[color:var(--muted)]/60 focus:border-[color:var(--gold)]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs text-[color:var(--muted)]">
              Min price
            </span>
            <input
              type="text"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={type === "buy" ? "£100,000" : "£500 pcm"}
              className="w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none placeholder:text-[color:var(--muted)]/60 focus:border-[color:var(--gold)]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs text-[color:var(--muted)]">
              Max price
            </span>
            <input
              type="text"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={type === "buy" ? "£500,000" : "£2,000 pcm"}
              className="w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none placeholder:text-[color:var(--muted)]/60 focus:border-[color:var(--gold)]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs text-[color:var(--muted)]">
              Bedrooms
            </span>
            <select
              value={beds}
              onChange={(e) => setBeds(e.target.value)}
              className="w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
            >
              <option value="" className="bg-[color:var(--navy)]">
                Any
              </option>
              <option value="1" className="bg-[color:var(--navy)]">
                1+
              </option>
              <option value="2" className="bg-[color:var(--navy)]">
                2+
              </option>
              <option value="3" className="bg-[color:var(--navy)]">
                3+
              </option>
              <option value="4" className="bg-[color:var(--navy)]">
                4+
              </option>
              <option value="5" className="bg-[color:var(--navy)]">
                5+
              </option>
            </select>
          </label>
        </div>

        <div className="mt-8 text-center">
          <Link
            href={searchHref}
            className="btn-gold inline-block px-10 py-3 text-sm font-medium tracking-wide uppercase"
          >
            Search properties
          </Link>
        </div>
      </div>
    </section>
  );
}
