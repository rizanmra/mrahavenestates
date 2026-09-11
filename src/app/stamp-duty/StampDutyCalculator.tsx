"use client";

import { FormEvent, useMemo, useState } from "react";

const BANDS = [
  { upTo: 125_000, rate: 0 },
  { upTo: 250_000, rate: 0.02 },
  { upTo: 925_000, rate: 0.05 },
  { upTo: 1_500_000, rate: 0.1 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.12 },
] as const;

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function calculateStampDuty(price: number, additional: boolean) {
  let remaining = price;
  let lastCap = 0;
  let duty = 0;

  for (const band of BANDS) {
    const slice = Math.min(remaining, band.upTo - lastCap);
    if (slice > 0) {
      duty += slice * band.rate;
      remaining -= slice;
    }
    lastCap = band.upTo;
    if (remaining <= 0) break;
  }

  if (additional) {
    duty += price * 0.05;
  }

  return duty;
}

export function StampDutyCalculator() {
  const [price, setPrice] = useState("325000");
  const [additional, setAdditional] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const parsedPrice = useMemo(() => Number(price.replace(/,/g, "")), [price]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setResult(null);
      return;
    }
    setResult(calculateStampDuty(parsedPrice, additional));
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-6">
      <label className="block">
        <span className="text-sm text-white">Property price (£)</span>
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          inputMode="numeric"
          required
          className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
        />
      </label>
      <label className="flex items-center gap-3 text-sm text-[color:var(--muted)]">
        <input
          type="checkbox"
          checked={additional}
          onChange={(event) => setAdditional(event.target.checked)}
        />
        Additional property (5% surcharge)
      </label>
      <button type="submit" className="btn-gold px-8 py-3 text-sm uppercase">
        Calculate
      </button>
      {result !== null && Number.isFinite(parsedPrice) ? (
        <div className="border border-[color:var(--line)] bg-[color:var(--navy-light)] p-6">
          <p className="text-xs tracking-widest text-[color:var(--gold)] uppercase">
            Estimated SDLT (England &amp; NI)
          </p>
          <p className="font-display mt-2 text-4xl text-white">
            {formatGbp(result)}
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Based on a purchase price of {formatGbp(parsedPrice)}. This is a
            guide only — always confirm with a solicitor or advisor.
          </p>
        </div>
      ) : null}
    </form>
  );
}
