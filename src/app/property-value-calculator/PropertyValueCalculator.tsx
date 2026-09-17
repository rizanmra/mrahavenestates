"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatGbp, type FloorAreaEstimate } from "@/lib/land-registry";
import { validateEmail } from "@/lib/form-validation";

const fieldClass =
  "mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]";
const labelClass = "text-sm text-white";

const NO_SALES_ERROR =
  "Not enough recent Land Registry sales near that postcode. Try a neighbouring England & Wales postcode.";

const PROPERTY_TYPES = [
  { value: "detached", label: "Detached" },
  { value: "semi", label: "Semi-detached" },
  { value: "terrace", label: "Terraced" },
  { value: "flat", label: "Flat / maisonette" },
  { value: "bungalow", label: "Bungalow" },
] as const;

type Step = "form" | "email" | "result";

export function PropertyValueCalculator() {
  const { session, isAdmin } = useAuth();

  const [postcode, setPostcode] = useState("");
  const [propertyType, setPropertyType] = useState("semi");
  const [floorAreaSqFt, setFloorAreaSqFt] = useState("1200");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<FloorAreaEstimate | null>(null);
  const [step, setStep] = useState<Step>("form");
  /** Unlocks result for this page visit only — resets when the component unmounts. */
  const [unlocked, setUnlocked] = useState(false);

  const [email, setEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromQuery = new URLSearchParams(window.location.search).get(
      "postcode",
    );
    if (fromQuery?.trim()) setPostcode(fromQuery.trim().toUpperCase());
  }, []);

  async function onCalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEmailError("");
    setLoading(true);
    setPending(null);
    if (!unlocked) setStep("form");
    try {
      const res = await fetch("/api/property-value-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode,
          propertyType,
          floorAreaSqFt,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        estimate?: FloorAreaEstimate;
      };
      if (!res.ok || !data.ok || !data.estimate) {
        setError(data.error || NO_SALES_ERROR);
        setStep("form");
        return;
      }

      setPending(data.estimate);

      if (isAdmin || unlocked) {
        setStep("result");
        return;
      }

      // Logged-in clients already have an email — unlock for this visit.
      if (session?.email) {
        setUnlocked(true);
        setStep("result");
        return;
      }

      setStep("email");
    } catch {
      setError("Lookup failed. Please try again.");
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  async function onEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) return;
    const emailErrorMsg = validateEmail(email);
    if (emailErrorMsg) {
      setEmailError(emailErrorMsg);
      return;
    }
    setEmailError("");
    setEmailBusy(true);
    try {
      const clean = email.trim().toLowerCase();
      const res = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setEmailError(data.error || "Please enter a valid email address.");
        return;
      }
      setUnlocked(true);
      setStep("result");
    } catch {
      setEmailError("Email check failed. Please try again.");
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="mt-10 space-y-10">
      <form onSubmit={onCalculate} className="space-y-6">
        <label className="block">
          <span className={labelClass}>Postcode (England &amp; Wales)</span>
          <input
            required
            value={postcode}
            onChange={(event) => setPostcode(event.target.value)}
            placeholder="e.g. BD9 4AA"
            autoComplete="postal-code"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Property type</span>
          <select
            value={propertyType}
            onChange={(event) => setPropertyType(event.target.value)}
            className={fieldClass}
          >
            {PROPERTY_TYPES.map((type) => (
              <option
                key={type.value}
                value={type.value}
                className="bg-[color:var(--navy)]"
              >
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Floor area (sq ft)</span>
          <input
            required
            value={floorAreaSqFt}
            onChange={(event) => setFloorAreaSqFt(event.target.value)}
            inputMode="numeric"
            placeholder="e.g. 1,250"
            className={fieldClass}
          />
          <span className="mt-2 block text-xs text-[color:var(--muted)]">
            Use internal floor area from your EPC, floor plan, or agent brochure.
          </span>
        </label>

        {error ? (
          <p className="rounded-sm border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-4 py-3 text-sm text-[color:var(--gold)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="btn-gold px-8 py-3 text-sm uppercase disabled:opacity-60"
        >
          {loading ? "Calculating…" : "Calculate local estimate"}
        </button>
      </form>

      {step === "email" && pending ? (
        <form
          onSubmit={onEmail}
          className="space-y-6 border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6 sm:p-8"
        >
          <div>
            <p className="text-xs tracking-widest text-[color:var(--gold)] uppercase">
              Estimate ready
            </p>
            <h3 className="font-display mt-2 text-3xl text-white">
              Unlock your local estimate
            </h3>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              We found enough recent Land Registry sales near{" "}
              <span className="text-[color:var(--gold)]">{pending.area}</span>.
              Enter your email to reveal the figure.
            </p>
          </div>
          <label className="block">
            <span className={labelClass}>Email *</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              className={fieldClass}
              autoComplete="email"
            />
          </label>
          {emailError ? (
            <p className="text-sm text-[color:var(--gold)]">{emailError}</p>
          ) : null}
          <button
            type="submit"
            disabled={emailBusy}
            className="btn-gold px-8 py-3 text-sm uppercase disabled:opacity-60"
          >
            {emailBusy ? "Checking…" : "Show estimate"}
          </button>
        </form>
      ) : null}

      {step === "result" && pending && (unlocked || isAdmin) ? (
        <div className="space-y-6 border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6 sm:p-8">
          <div>
            <p className="text-xs tracking-widest text-[color:var(--gold)] uppercase">
              Local estimate · {pending.area}
            </p>
            <p className="font-display mt-2 text-5xl text-white">
              {formatGbp(pending.mid)}
            </p>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              Range {formatGbp(pending.low)} – {formatGbp(pending.high)}
            </p>
          </div>

          <dl className="grid gap-4 border-t border-[color:var(--line)] pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[color:var(--muted)]">Price per m²</dt>
              <dd className="mt-1 font-medium text-[color:var(--gold)]">
                {formatGbp(pending.pricePerSqM)}
              </dd>
            </div>
            <div>
              <dt className="text-[color:var(--muted)]">Price per sq ft</dt>
              <dd className="mt-1 font-medium text-[color:var(--gold)]">
                {formatGbp(pending.pricePerSqFt)}
              </dd>
            </div>
            <div>
              <dt className="text-[color:var(--muted)]">Your floor area</dt>
              <dd className="mt-1 text-white">
                {pending.floorAreaSqFt.toLocaleString("en-GB")} sq ft (
                {pending.floorAreaM2} m²)
              </dd>
            </div>
            <div>
              <dt className="text-[color:var(--muted)]">Comparable sales used</dt>
              <dd className="mt-1 text-white">{pending.salesCount}</dd>
            </div>
          </dl>

          <p className="text-[11px] leading-relaxed text-white/45">
            {pending.attribution} Sold prices from HM Land Registry SPARQL open
            data are converted to £/m²
            {pending.method === "epc"
              ? " using Domestic EPC floor areas where matched"
              : " using typical floor areas for the property type (PPD has no size field)"}
            , then multiplied by your entered area. Guide only — not a RICS
            valuation.
          </p>
        </div>
      ) : null}
    </div>
  );
}
