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
import {
  formatUkAddressLine,
  formatUkPostcode,
  validateEmail,
  validateUkPostcode,
} from "@/lib/form-validation";

const types = Object.keys(propertyTypeLabels) as PropertyTypeEstimate[];
const conditions = Object.keys(conditionLabels) as PropertyCondition[];

type Step = "details" | "optin" | "result";

const fieldClass =
  "mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]";
const selectClass =
  "mt-2 w-full border-b border-[color:var(--line)] bg-[color:var(--navy)] py-2 text-white outline-none focus:border-[color:var(--gold)]";

export function PropertyValueCalculator() {
  const { session, recordEnquiry, isAdmin } = useAuth();
  const [step, setStep] = useState<Step>("details");

  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [propertyType, setPropertyType] =
    useState<PropertyTypeEstimate>("semi");
  const [bedrooms, setBedrooms] = useState("3");
  const [condition, setCondition] = useState<PropertyCondition>("good");
  const [hasGarden, setHasGarden] = useState(true);
  const [hasParking, setHasParking] = useState(true);

  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);

  const [pendingEstimate, setPendingEstimate] = useState<MarketEstimate | null>(
    null,
  );
  const [estimate, setEstimate] = useState<MarketEstimate | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const beds = useMemo(() => Number(bedrooms), [bedrooms]);

  function unlockEstimate(
    result: MarketEstimate,
    lead: {
      name?: string;
      email: string;
      phone?: string;
      address?: string;
      postcode?: string;
    },
  ) {
    const displayAddress = lead.address ?? formatUkAddressLine(address);
    const displayPostcode =
      lead.postcode ??
      formatUkPostcode(postcode) ??
      postcode.trim().toUpperCase();

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

      if (session) {
        recordEnquiry(
          "valuation",
          `Online estimate ${formatGbp(result.mid)} — ${displayAddress}, ${displayPostcode} (${propertyTypeLabels[propertyType]}, ${beds} ${beds === 1 ? "bedroom" : "bedrooms"})`,
        );
      }
    }

    setAddress(displayAddress);
    setPostcode(displayPostcode);
    setError("");
    setEstimate(result);
    setStep("result");
  }

  async function onDetails(event: FormEvent<HTMLFormElement>) {
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
    setBusy(true);
    setError("");

    let result = estimateMarketValue({
      postcode: formattedPostcode,
      propertyType,
      bedrooms: beds,
      condition,
      hasGarden,
      hasParking,
    });

    try {
      const res = await fetch("/api/valuation-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: formattedPostcode,
          propertyType,
          bedrooms: beds,
          condition,
          hasGarden,
          hasParking,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        estimate?: MarketEstimate;
      };
      if (res.ok && data.ok && data.estimate) {
        result = data.estimate;
      }
    } catch {
      // Keep the local guide if Land Registry is unavailable.
    } finally {
      setBusy(false);
    }

    if (!result) {
      setError("Enter a valid UK postcode and bedrooms.");
      return;
    }
    setPendingEstimate(result);

    if (session) {
      unlockEstimate(result, {
        name: session.name,
        email: session.email,
        phone: session.phone || "",
        address: formattedAddress,
        postcode: formattedPostcode,
      });
      return;
    }

    setStep("optin");
  }

  function onOptIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingEstimate) return;

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    unlockEstimate(pendingEstimate, {
      email: email.trim().toLowerCase(),
    });
  }

  function startAgain() {
    setStep("details");
    setPendingEstimate(null);
    setEstimate(null);
    setError("");
  }

  if (step === "result" && estimate) {
    return (
      <div className="mx-auto mt-10 max-w-xl border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6 md:p-8">
        <ResultPanel
          estimate={estimate}
          address={address}
          postcode={postcode}
          onAgain={startAgain}
        />
      </div>
    );
  }

  return (
    <div className="mt-0 grid grid-cols-1 gap-10 text-left lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
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
              placeholder="e.g. 12 Oak Street, Bradford"
              autoComplete="street-address"
              className={fieldClass}
            />
            <span className="mt-2 block text-xs text-[color:var(--muted)]">
              The online estimate uses your postcode area. Address helps if you
              book a free in-person valuation.
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

          <div className="grid gap-6 md:grid-cols-2">
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

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[color:var(--muted)]">
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

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="btn-gold px-8 py-3 text-sm uppercase disabled:opacity-70"
          >
            {busy ? "Checking sold prices…" : "Continue to unlock estimate"}
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
              Enter a valid email to reveal your indicative value. We can follow
              up with a free, no-obligation valuation if you want a precise
              figure.
            </p>
          </div>

          <label className="block">
            <span className="text-sm text-white">Email</span>
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

          {error ? <p className="text-sm text-error">{error}</p> : null}

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

      <aside className="border border-[color:var(--line)] bg-[color:var(--navy-deep)] p-6 md:p-8">
        <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
          How it works
        </p>
        <h2 className="font-display mt-3 text-3xl text-white">
          Address in → rough market value out
        </h2>
        <ol className="mt-6 space-y-4 text-sm leading-relaxed text-[color:var(--muted)]">
            <li>
              <span className="text-[color:var(--gold)]">1.</span> Enter a full
              UK postcode — we check recent HM Land Registry sold prices first
            </li>
            <li>
              <span className="text-[color:var(--gold)]">2.</span> Enter your
              email to unlock the estimate
            </li>
            <li>
              <span className="text-[color:var(--gold)]">3.</span> See an
              indicative postcode-area range, then book a free in-person
              valuation
            </li>
        </ol>
        {pendingEstimate && step === "optin" ? (
          <p className="mt-8 text-sm text-[color:var(--gold)]">
            Your estimate is ready — unlock it with your email.
          </p>
        ) : null}
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
  const displayAddress = formatUkAddressLine(address);
  const displayPostcode = formatUkPostcode(postcode) ?? postcode.toUpperCase();

  return (
    <div className="text-center">
      <p className="text-xs tracking-[0.3em] text-[color:var(--gold)] uppercase">
        Estimated market value · {displayPostcode}
      </p>
      {displayAddress ? (
        <p className="mt-3 text-sm text-[color:var(--muted)]">{displayAddress}</p>
      ) : (
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          Postcode-area guide for {displayPostcode}
        </p>
      )}
      <p className="font-display mt-4 text-5xl text-white md:text-6xl">
        {formatGbp(estimate.mid)}
      </p>
      <p className="mt-4 text-sm text-[color:var(--muted)]">
        Likely range{" "}
        <span className="text-white">
          {formatGbp(estimate.low)} – {formatGbp(estimate.high)}
        </span>
      </p>
      <p className="mx-auto mt-3 max-w-md text-xs text-[color:var(--muted)]">
        {estimate.source === "sold-prices"
          ? `Based on ${estimate.salesCount ?? "recent"} HM Land Registry sold prices in ${estimate.area}.`
          : estimate.confidence === "local"
            ? `Guide figure for the ${estimate.area} postcode area when sold-price records are thin.`
            : "Wider regional guide — book a valuation for a localised figure."}
      </p>
      <div className="mt-8 space-y-3">
        <Link
          href="/free-valuation"
          className="btn-gold inline-block w-full px-6 py-3 text-center text-sm uppercase"
        >
          Book a free accurate valuation
        </Link>
        <button
          type="button"
          onClick={onAgain}
          className="btn-outline-gold inline-block w-full px-6 py-3 text-center text-sm uppercase"
        >
          Check another property
        </button>
      </div>
      <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-[color:var(--muted)]">
        This is an illustrative estimate only — not a formal valuation or RICS
        appraisal. Market conditions change; always get professional advice
        before selling or buying.
      </p>
    </div>
  );
}
