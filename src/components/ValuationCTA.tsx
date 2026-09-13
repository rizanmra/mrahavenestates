"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  conditionLabels,
  estimateMarketValue,
  formatGbp,
  propertyTypeLabels,
  type PropertyCondition,
  type PropertyTypeEstimate,
  type MarketEstimate,
} from "@/lib/market-estimate";
import { sendInboxEnquiry } from "@/lib/send-inbox-enquiry";
import { saveValuationLead } from "@/lib/valuation-leads";
import {
  formatUkAddressLine,
  formatUkPostcode,
  validateEmail,
  validateUkPostcode,
} from "@/lib/form-validation";

type Step = "ask" | "details" | "optin" | "result" | "skip";

const STORAGE_KEY = "mra-home-value-address";

const types = Object.keys(propertyTypeLabels) as PropertyTypeEstimate[];
const conditions = Object.keys(conditionLabels) as PropertyCondition[];

const fieldClass =
  "mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2.5 text-white outline-none transition placeholder:text-white/35 focus:border-[color:var(--gold)]";
const selectClass =
  "mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2.5 text-white outline-none focus:border-[color:var(--gold)] [&>option]:bg-[color:var(--navy)]";

function extractUkPostcode(text: string): string {
  return formatUkPostcode(text) || "";
}

function applyHeroAddress(
  raw: string,
  setters: {
    setAddress: (v: string) => void;
    setPostcode: (v: string) => void;
    setStep: (s: Step) => void;
    setError: (v: string) => void;
  },
) {
  const trimmed = raw.trim();
  setters.setError("");
  if (!trimmed) {
    setters.setStep("ask");
    return;
  }
  const postcode = extractUkPostcode(trimmed);
  const addressOnly = postcode
    ? trimmed
        .replace(new RegExp(postcode.replace(/\s+/g, "\\s*"), "i"), "")
        .replace(/,\s*$/, "")
        .trim()
    : trimmed;
  setters.setAddress(addressOnly || trimmed);
  if (postcode) setters.setPostcode(postcode);
  setters.setStep("details");
}

export function ValuationCTA() {
  const { session, recordEnquiry, isAdmin } = useAuth();
  const [step, setStep] = useState<Step>("ask");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [propertyType, setPropertyType] =
    useState<PropertyTypeEstimate>("semi");
  const [bedrooms, setBedrooms] = useState("3");
  const [condition, setCondition] = useState<PropertyCondition>("good");
  const [hasGarden, setHasGarden] = useState(true);
  const [hasParking, setHasParking] = useState(true);
  const [email, setEmail] = useState("");
  const [marketingOptIn] = useState(true);
  const [pendingEstimate, setPendingEstimate] = useState<MarketEstimate | null>(
    null,
  );
  const [estimate, setEstimate] = useState<MarketEstimate | null>(null);
  const [error, setError] = useState("");
  const [emailChecking, setEmailChecking] = useState(false);

  const beds = useMemo(() => Number(bedrooms), [bedrooms]);

  useEffect(() => {
    const setters = { setAddress, setPostcode, setStep, setError };

    function onHeroValue(event: Event) {
      const detail = (event as CustomEvent<{ address?: string }>).detail;
      applyHeroAddress(detail?.address ?? "", setters);
    }

    window.addEventListener("mra-home-value", onHeroValue);

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        applyHeroAddress(stored, setters);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }

    return () => window.removeEventListener("mra-home-value", onHeroValue);
  }, []);

  function unlockEstimate(
    result: MarketEstimate,
    lead: { name?: string; email: string; phone?: string },
  ) {
    const displayAddress = formatUkAddressLine(address);
    const displayPostcode =
      formatUkPostcode(postcode) ?? postcode.trim().toUpperCase();

    if (!isAdmin) {
      saveValuationLead({
        name: lead.name?.trim() || "Website visitor",
        email: lead.email,
        phone: lead.phone?.trim() || "",
        address: displayAddress,
        postcode: displayPostcode,
        propertyType,
        bedrooms: beds,
        estimateMid: result.mid,
        estimateLow: result.low,
        estimateHigh: result.high,
        marketingOptIn,
      });

      const summary = `Homepage estimate ${formatGbp(result.mid)} — ${displayAddress}, ${displayPostcode}`;
      void sendInboxEnquiry({
        name: lead.name?.trim() || session?.name || "Website visitor",
        email: lead.email || session?.email || "",
        phone: lead.phone || session?.phone,
        message: summary,
        reason: "valuation",
      }).then((sent) => {
        if (session) {
          recordEnquiry("valuation", summary, {
            sourceEnquiryId: sent.id,
            status: "open",
          });
        }
      });
    }

    setAddress(displayAddress);
    setPostcode(displayPostcode);
    setError("");
    setEstimate(result);
    setStep("result");
  }

  function onDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formattedAddress = formatUkAddressLine(address);
    const formattedPostcode = formatUkPostcode(postcode);
    const postcodeError = validateUkPostcode(postcode);
    if (postcodeError || !formattedPostcode) {
      setError(postcodeError || "Enter a full UK postcode (e.g. BD1 5AH).");
      return;
    }

    setAddress(formattedAddress);
    setPostcode(formattedPostcode);

    const result = estimateMarketValue({
      postcode: formattedPostcode,
      propertyType,
      bedrooms: beds,
      condition,
      hasGarden,
      hasParking,
    });
    if (!result) {
      setError("Enter a valid UK postcode and bedrooms.");
      return;
    }
    setError("");
    setPendingEstimate(result);

    if (session) {
      unlockEstimate(result, {
        name: session.name,
        email: session.email,
        phone: session.phone || "",
      });
      return;
    }

    setStep("optin");
  }

  async function onOptIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingEstimate) return;

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setError("");
    setEmailChecking(true);
    try {
      const res = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await res.json()) as { valid?: boolean; error?: string };
      if (!res.ok || !data.valid) {
        setError(data.error || "Please enter a valid email address.");
        return;
      }

      unlockEstimate(pendingEstimate, {
        email: email.trim().toLowerCase(),
      });
    } catch {
      setError("Email check failed. Please try again.");
    } finally {
      setEmailChecking(false);
    }
  }

  function resetToAsk() {
    setStep("ask");
    setPendingEstimate(null);
    setEstimate(null);
    setError("");
  }

  return (
    <section
      id="market-value"
      className="relative overflow-hidden scroll-mt-28 px-6 py-24 lg:px-10"
    >
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85"
          alt=""
          fill
          className="object-cover scale-105 home-value-ken"
          sizes="100vw"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,21,37,0.94)_0%,rgba(11,30,51,0.88)_45%,rgba(11,30,51,0.78)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(196,164,124,0.18),transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {step === "ask" ? (
          <div className="home-value-panel mx-auto max-w-3xl text-center">
            <p className="text-xs tracking-[0.35em] text-[color:var(--gold)] uppercase">
              Free market value
            </p>
            <h2 className="font-display mt-5 text-4xl leading-tight text-white md:text-6xl">
              Want to know what your property is worth?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--muted)]">
              Get an instant estimated market value for your home anywhere in
              the UK — one of the clearest ways to start your next move with
              MRA Haven Estates.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("details");
                }}
                className="btn-gold px-10 py-4 text-sm font-medium tracking-wide uppercase"
              >
                Yes — find my value
              </button>
              <button
                type="button"
                onClick={() => setStep("skip")}
                className="btn-outline-gold px-10 py-4 text-sm font-medium tracking-wide uppercase"
              >
                Not right now
              </button>
            </div>
            <p className="mt-8 text-sm text-[color:var(--muted)]">
              Or enter your address in the search bar above and choose{" "}
              <span className="text-[color:var(--gold)]">Value</span>.
            </p>
          </div>
        ) : null}

        {step === "skip" ? (
          <div className="home-value-panel mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl text-white md:text-4xl">
              No problem
            </h2>
            <p className="mt-4 text-[color:var(--muted)]">
              Browse homes when you&apos;re ready — or come back anytime for a
              free estimate.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/properties"
                className="btn-gold px-8 py-3 text-sm uppercase"
              >
                Browse properties
              </Link>
              <button
                type="button"
                onClick={() => setStep("details")}
                className="btn-outline-gold px-8 py-3 text-sm uppercase"
              >
                Actually, check my value
              </button>
            </div>
          </div>
        ) : null}

        {step === "details" ? (
          <div className="home-value-panel grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
                Instant estimate
              </p>
              <h2 className="font-display mt-3 text-3xl text-white md:text-5xl">
                Enter your address
              </h2>
              <p className="mt-4 text-[color:var(--muted)]">
                Tell us a little about the property and we&apos;ll calculate an
                indicative market value.
              </p>
              <button
                type="button"
                onClick={resetToAsk}
                className="mt-6 text-sm text-[color:var(--gold)] transition-colors hover:text-white"
              >
                ← Back
              </button>
            </div>

            <form onSubmit={onDetails} className="space-y-5" noValidate>
              <label className="block">
                <span className="text-sm text-white">
                  Property address{" "}
                  <span className="text-[color:var(--muted)]">(optional)</span>
                </span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => {
                    if (address.trim()) setAddress(formatUkAddressLine(address));
                  }}
                  placeholder="e.g. 12 Oak Street, Manchester"
                  autoComplete="street-address"
                  className={fieldClass}
                />
                <span className="mt-2 block text-xs text-[color:var(--muted)]">
                  Estimate uses postcode area. Address helps for a follow-up
                  valuation.
                </span>
              </label>
              <label className="block">
                <span className="text-sm text-white">Postcode *</span>
                <input
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  onBlur={() => {
                    const formatted = formatUkPostcode(postcode);
                    if (formatted) setPostcode(formatted);
                  }}
                  required
                  placeholder="e.g. BD8 9AJ"
                  autoComplete="postal-code"
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className="text-sm text-white">Property type</span>
                <select
                  value={propertyType}
                  onChange={(e) =>
                    setPropertyType(e.target.value as PropertyTypeEstimate)
                  }
                  className={selectClass}
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {propertyTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-white">Bedrooms</span>
                  <input
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    inputMode="numeric"
                    min={1}
                    max={8}
                    required
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-white">Condition</span>
                  <select
                    value={condition}
                    onChange={(e) =>
                      setCondition(e.target.value as PropertyCondition)
                    }
                    className={selectClass}
                  >
                    {conditions.map((item) => (
                      <option key={item} value={item}>
                        {conditionLabels[item]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-[color:var(--muted)]">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasGarden}
                    onChange={(e) => setHasGarden(e.target.checked)}
                  />
                  Garden
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasParking}
                    onChange={(e) => setHasParking(e.target.checked)}
                  />
                  Off-street parking
                </label>
              </div>
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <button
                type="submit"
                className="btn-gold w-full px-8 py-3.5 text-sm uppercase sm:w-auto"
              >
                Continue
              </button>
            </form>
          </div>
        ) : null}

        {step === "optin" ? (
          <div className="home-value-panel mx-auto max-w-xl">
            <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
              Unlock estimate
            </p>
            <h2 className="font-display mt-3 text-3xl text-white md:text-4xl">
              Almost there
            </h2>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              Enter a valid email to reveal your indicative market value.
            </p>
            <form onSubmit={onOptIn} className="mt-8 space-y-5" noValidate>
              <label className="block">
                <span className="text-sm text-white">Email *</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="name@email.com"
                  className={fieldClass}
                />
              </label>
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={emailChecking}
                  className="btn-gold px-8 py-3 text-sm uppercase disabled:opacity-70"
                >
                  {emailChecking ? "Checking email…" : "Show my estimated value"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setError("");
                  }}
                  className="btn-outline-gold px-6 py-3 text-sm uppercase"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {step === "result" && estimate ? (
          <div className="home-value-panel home-value-reveal mx-auto max-w-2xl text-center">
            <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
              Estimated market value ·{" "}
              {formatUkPostcode(postcode) ?? postcode.toUpperCase()}
            </p>
            <p className="mt-4 text-sm text-[color:var(--muted)]">
              {formatUkAddressLine(address) ||
                `Postcode-area guide for ${formatUkPostcode(postcode) ?? postcode.toUpperCase()}`}
            </p>
            <p className="font-display mt-6 text-5xl text-white md:text-7xl">
              {formatGbp(estimate.mid)}
            </p>
            <p className="mt-4 text-[color:var(--muted)]">
              Likely range{" "}
              <span className="text-white">
                {formatGbp(estimate.low)} – {formatGbp(estimate.high)}
              </span>
            </p>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-[color:var(--muted)]">
              Illustrative estimate only — not a formal valuation. Book a free
              in-person appraisal for a precise figure.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/free-valuation"
                className="btn-gold px-8 py-3.5 text-sm uppercase"
              >
                Book a free accurate valuation
              </Link>
              <button
                type="button"
                onClick={() => {
                  setAddress("");
                  setPostcode("");
                  resetToAsk();
                }}
                className="btn-outline-gold px-8 py-3.5 text-sm uppercase"
              >
                Check another property
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
