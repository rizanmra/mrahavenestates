"use client";

import Link from "next/link";
import { useState } from "react";

type SearchType = "buy" | "rent";

export function HeroSearchPanel() {
  const [type, setType] = useState<SearchType>("buy");
  const [location, setLocation] = useState("");

  const searchHref = `/properties?type=${type === "buy" ? "sale" : "rent"}${
    location ? `&location=${encodeURIComponent(location.trim())}` : ""
  }`;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-sm border border-[color:var(--line)] bg-[color:var(--navy-light)] shadow-2xl">
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-stretch">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Enter a place or postcode</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter a Place or Postcode"
              className="w-full bg-white px-4 py-3.5 text-sm text-[color:var(--navy)] outline-none placeholder:text-gray-400"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <button
              type="button"
              onClick={() => setType("buy")}
              className={`px-5 py-3.5 text-sm font-semibold tracking-wide uppercase transition-colors ${
                type === "buy"
                  ? "bg-[#c41e3a] text-white"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setType("rent")}
              className={`px-5 py-3.5 text-sm font-semibold tracking-wide uppercase transition-colors ${
                type === "rent"
                  ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Rent
            </button>
          </div>

          <Link
            href={searchHref}
            className="bg-[#c41e3a] px-6 py-3.5 text-center text-sm font-semibold tracking-wide text-white uppercase transition-colors hover:bg-[#a81832] sm:shrink-0"
          >
            Search
          </Link>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-[color:var(--muted)]">
        Search homes across Bradford and West Yorkshire ·{" "}
        <Link
          href="/free-valuation"
          className="font-medium text-[color:var(--gold)] hover:underline"
        >
          Free instant valuation
        </Link>
      </p>
    </div>
  );
}
