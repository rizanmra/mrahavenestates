"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { extractPostcode } from "@/lib/land-registry";

type SearchMode = "rent" | "value";

const placeholders: Record<SearchMode, string> = {
  rent: "Enter a place, address or postcode",
  value: "Enter a postcode to estimate value…",
};

export function HeroSearchPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("rent");
  const [location, setLocation] = useState("");

  function openValueCalculator(address: string) {
    const trimmed = address.trim();
    const postcode = extractPostcode(trimmed);
    const href = postcode
      ? `/property-value-calculator?postcode=${encodeURIComponent(postcode)}`
      : "/property-value-calculator";
    if (trimmed && typeof document !== "undefined") {
      const homeSection = document.getElementById("property-value-calculator");
      if (homeSection && !postcode) {
        homeSection.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    router.push(href);
  }

  function goRent() {
    const trimmed = location.trim();
    const href = trimmed
      ? `/properties?type=rent&location=${encodeURIComponent(trimmed)}`
      : "/properties?type=rent";
    router.push(href);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "value") {
      openValueCalculator(location);
      return;
    }
    goRent();
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {mode === "value" ? (
        <p className="home-value-prompt mb-3 text-center text-sm tracking-wide text-[color:var(--gold)] md:text-base">
          Land Registry £/m² estimate — nationwide across the UK
        </p>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="overflow-hidden rounded-sm border border-[color:var(--line)] bg-[color:var(--navy-light)] shadow-2xl"
      >
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-stretch">
          <label className="min-w-0 flex-1">
            <span className="sr-only">
              {mode === "value"
                ? "Enter a postcode for a value estimate"
                : "Enter a place or postcode"}
            </span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={placeholders[mode]}
              autoComplete={mode === "value" ? "postal-code" : "address-level2"}
              className="w-full bg-white px-4 py-3.5 text-sm text-[color:var(--navy)] outline-none placeholder:text-[color:var(--navy)]/50"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <button
              type="button"
              onClick={() => {
                setMode("rent");
                goRent();
              }}
              className={`cursor-pointer px-4 py-3.5 text-sm font-semibold tracking-wide uppercase transition-colors sm:px-5 ${
                mode === "rent"
                  ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Rent
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("value");
                openValueCalculator(location);
              }}
              className={`cursor-pointer px-4 py-3.5 text-sm font-semibold tracking-wide uppercase transition-colors sm:px-5 ${
                mode === "value"
                  ? "bg-[color:var(--gold)] text-[color:var(--navy)]"
                  : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              Value
            </button>
          </div>
        </div>
      </form>

      <p className="mt-3 text-center text-base text-[color:var(--muted)] md:text-lg">
        {mode === "value" ? (
          <>HM Land Registry sold prices × your floor area</>
        ) : (
          <>
            Find homes to rent nationwide across the UK ·{" "}
            <button
              type="button"
              onClick={() => {
                setMode("value");
                openValueCalculator(location);
              }}
              className="cursor-pointer font-medium text-[color:var(--gold)] hover:underline"
            >
              What&apos;s my home worth?
            </button>
          </>
        )}
      </p>
    </div>
  );
}
