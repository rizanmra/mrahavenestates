"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  conditionLabels,
  estimateMarketValue,
  formatGbp,
  propertyTypeLabels,
  type PropertyCondition,
  type PropertyTypeEstimate,
  type MarketEstimate,
} from "@/lib/market-estimate";
import { saveValuationLead } from "@/lib/valuation-leads";
import { useAuth } from "@/components/AuthProvider";

const types = Object.keys(propertyTypeLabels) as PropertyTypeEstimate[];
const conditions = Object.keys(conditionLabels) as PropertyCondition[];

type Step = "details" | "optin" | "result";

const fieldClass =
  "mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]";
const selectClass =
  "mt-2 w-full border-b border-[color:var(--line)] bg-[color:var(--navy)] py-2 text-white outline-none focus:border-[color:var(--gold)]";

export function PropertyValueCalculator() {
  const { session, recordEnquiry } = useAuth();
  const [step, setStep] = useState<Step>("details");

  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [propertyType, setPropertyType] =
    useState<PropertyTypeEstimate>("semi");
  const [bedrooms, setBedrooms] = useState("3");
  const [condition, setCondition] = useState<PropertyCondition>("good");
  const [hasGarden, setHasGarden] = useState(true);
  const [hasParking, setHasParking] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);

  const [pendingEstimate, setPendingEstimate] = useState<MarketEstimate | null>(
    null,
  );
  const [estimate, setEstimate] = useState<MarketEstimate | null>(null);
  const [error, setError] = useState("");

  const beds = useMemo(() => Number(bedrooms), [bedrooms]);

  function onDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = estimateMarketValue({
      postcode,
      propertyType,
      bedrooms: beds,
      condition,
      hasGarden,
      hasParking,
    });
    if (!result || !address.trim()) {
      setError("Enter your property address, a valid UK postcode, and bedrooms.");
      return;
    }
    setError("");
    setPendingEstimate(result);
    setStep("optin");
  }

  function onOptIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingEstimate) return;
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please add your name, email and phone to unlock the estimate.");
      return;
    }

    saveValuationLead({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      postcode: postcode.trim().toUpperCase(),
      propertyType,
      bedrooms: beds,
      estimateMid: pendingEstimate.mid,
      estimateLow: pendingEstimate.low,
      estimateHigh: pendingEstimate.high,
      marketingOptIn,
    });

    if (session) {
      recordEnquiry(
        "valuation",
        `Online estimate ${formatGbp(pendingEstimate.mid)} — ${address.trim()}, ${postcode.trim()} (${propertyTypeLabels[propertyType]}, ${beds} bed)`,
      );
    }

    setError("");
    setEstimate(pendingEstimate);
    setStep("result");
  }

  function startAgain() {
    setStep("details");
    setPendingEstimate(null);
    setEstimate(null);
    setError("");
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      {step === "details" ? (
        <form
          onSubmit={onDetails}
          className="space-y-6 border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6 md:p-8"
        >
          <div>
            <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
              Step 1 of 2
            </p>
            <h2 className="font-display mt-2 text-2xl text-white">
              Your property
            </h2>
          </div>

          <label className="block">
            <span className="text-sm text-white">Property address</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="e.g. 12 Oak Street, Bradford"
              autoComplete="street-address"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="text-sm text-white">Postcode</span>
            <input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
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

          <div className="grid gap-6 sm:grid-cols-2">
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
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasGarden}
                onChange={(e) => setHasGarden(e.target.checked)}
              />
              Garden
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasParking}
                onChange={(e) => setHasParking(e.target.checked)}
              />
              Off-street parking
            </label>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button type="submit" className="btn-gold px-8 py-3 text-sm uppercase">
            Continue to unlock estimate
          </button>
        </form>
      ) : null}

      {step === "optin" ? (
        <form
          onSubmit={onOptIn}
          className="space-y-6 border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6 md:p-8"
        >
          <div>
            <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
              Step 2 of 2 · Soft opt-in
            </p>
            <h2 className="font-display mt-2 text-2xl text-white">
              Unlock your market estimate
            </h2>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              We&apos;ll show your indicative value instantly and can follow up
              with a free, no-obligation valuation if you want a precise figure.
            </p>
          </div>

          <label className="block">
            <span className="text-sm text-white">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-sm text-white">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-sm text-white">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
              autoComplete="tel"
              className={fieldClass}
            />
          </label>

          <label className="flex items-start gap-3 text-sm text-[color:var(--muted)]">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-1"
            />
            <span>
              Happy for MRA Haven Estates to contact me about my estimate and
              local market updates. You can unsubscribe anytime.
            </span>
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-gold px-8 py-3 text-sm uppercase">
              Show my estimated value
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
          <p className="text-xs text-[color:var(--muted)]">
            By continuing you agree to our{" "}
            <Link href="/privacy" className="text-[color:var(--gold)]">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      ) : null}

      {step === "result" && estimate ? (
        <div className="space-y-6 border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6 md:p-8 lg:hidden">
          <ResultPanel
            estimate={estimate}
            address={address}
            postcode={postcode}
            onAgain={startAgain}
          />
        </div>
      ) : null}

      <aside className="border border-[color:var(--line)] bg-[color:var(--navy-deep)] p-6 md:p-8">
        {step !== "result" || !estimate ? (
          <div>
            <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
              How it works
            </p>
            <h2 className="font-display mt-3 text-3xl text-white">
              Address in → rough market value out
            </h2>
            <ol className="mt-6 space-y-4 text-sm leading-relaxed text-[color:var(--muted)]">
              <li>
                <span className="text-[color:var(--gold)]">1.</span> Enter your
                address and property details
              </li>
              <li>
                <span className="text-[color:var(--gold)]">2.</span> Leave soft
                contact details to unlock the estimate
              </li>
              <li>
                <span className="text-[color:var(--gold)]">3.</span> See an
                indicative range, then book a free in-person valuation
              </li>
            </ol>
            {pendingEstimate && step === "optin" ? (
              <p className="mt-8 text-sm text-[color:var(--gold)]">
                Your estimate is ready — unlock it with your details.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="hidden lg:block">
            <ResultPanel
              estimate={estimate}
              address={address}
              postcode={postcode}
              onAgain={startAgain}
            />
          </div>
        )}
      </aside>
    </div>
  );
}

function ResultPanel({
  estimate,
  address,
  postcode,
  onAgain,
}: {
  estimate: MarketEstimate;
  address: string;
  postcode: string;
  onAgain: () => void;
}) {
  return (
    <div>
      <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
        Estimated market value · {estimate.area}
      </p>
      <p className="mt-3 text-sm text-[color:var(--muted)]">
        {address}, {postcode}
      </p>
      <p className="font-display mt-4 text-5xl text-white md:text-6xl">
        {formatGbp(estimate.mid)}
      </p>
      <p className="mt-4 text-sm text-[color:var(--muted)]">
        Likely range{" "}
        <span className="text-white">
          {formatGbp(estimate.low)} – {formatGbp(estimate.high)}
        </span>
      </p>
      <p className="mt-3 text-xs text-[color:var(--muted)]">
        {estimate.confidence === "local"
          ? "Based on local postcode-area guidance for this outcode."
          : "Wider regional guide — book a valuation for a localised figure."}
      </p>
      <div className="mt-8 space-y-3">
        <Link
          href="/free-valuation"
          className="btn-gold inline-block w-full px-6 py-3 text-center text-sm uppercase"
        >
          Book a free accurate valuation
        </Link>
        <Link
          href="/stamp-duty"
          className="btn-outline-gold inline-block w-full px-6 py-3 text-center text-sm uppercase"
        >
          Stamp duty calculator
        </Link>
        <button
          type="button"
          onClick={onAgain}
          className="w-full py-2 text-sm text-[color:var(--muted)] hover:text-[color:var(--gold)]"
        >
          Check another property
        </button>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-[color:var(--muted)]">
        This is an illustrative estimate only — not a formal valuation or RICS
        appraisal. Market conditions change; always get professional advice
        before selling or buying.
      </p>
    </div>
  );
}
