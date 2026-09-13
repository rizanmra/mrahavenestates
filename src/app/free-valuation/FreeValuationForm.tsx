"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { formatGbp, type SoldTransaction } from "@/lib/land-registry";
import { validateEmail } from "@/lib/form-validation";
import { sendInboxEnquiry } from "@/lib/send-inbox-enquiry";

type Step = "intro" | "address" | "email" | "result";

type LookupSuccess = {
  matchedAddress: string;
  latest: SoldTransaction;
  history: SoldTransaction[];
  attribution: string;
};

const gold = "var(--gold)";
const fieldClass =
  "mt-2 w-full rounded-sm border border-[color:var(--gold)]/40 bg-[color:var(--navy-deep)] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[color:var(--gold)] focus:ring-2 focus:ring-[color:var(--gold)]/25";
const labelClass = "text-sm font-medium tracking-wide text-[color:var(--gold)]";
const btnPrimary =
  "inline-flex items-center justify-center rounded-sm bg-[color:var(--gold)] px-8 py-3.5 text-sm font-semibold tracking-[0.12em] text-[color:var(--navy)] uppercase transition hover:bg-[color:var(--gold-hover)] disabled:cursor-not-allowed disabled:opacity-60";
const btnGhost =
  "inline-flex items-center justify-center rounded-sm border border-[color:var(--gold)] px-8 py-3.5 text-sm font-semibold tracking-[0.12em] text-[color:var(--gold)] uppercase transition hover:bg-[color:var(--gold)]/10";
const mutedText = "text-[color:var(--muted)]";
const errorClass =
  "rounded-sm border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-4 py-3 text-sm text-[color:var(--gold)]";

export default function FreeValuationForm() {
  const { session, recordEnquiry, isAdmin } = useAuth();
  const [step, setStep] = useState<Step>("intro");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<LookupSuccess | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function revealResult(data: LookupSuccess, leadEmail?: string) {
    if (!isAdmin) {
      const summary = `Land Registry price unlock: ${data.matchedAddress}`;
      const contactEmail = leadEmail || session?.email || email;
      if (!contactEmail) {
        if (session) recordEnquiry("valuation", summary);
        setStep("result");
        return;
      }
      void sendInboxEnquiry({
        name: session?.name || "Website visitor",
        email: contactEmail,
        phone: session?.phone,
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
    setStep("result");
  }

  async function onAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/property-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, postcode }),
      });
      const data = await res.json();
      if (!res.ok || !data.found) {
        setError(
          data.error ||
            "We haven’t found a sale record for that address. Please check the details and try again.",
        );
        setPending(null);
        return;
      }
      const lookup = data as LookupSuccess;
      setPending(lookup);
      if (session) {
        revealResult(lookup);
        return;
      }
      setStep("email");
    } catch {
      setError("Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) return;
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.error || "Please enter a valid email address.");
        return;
      }
      revealResult(pending, email.trim().toLowerCase());
    } catch {
      setError("Email check failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetFlow() {
    setStep("intro");
    setAddress("");
    setPostcode("");
    setEmail("");
    setPending(null);
    setError("");
  }

  return (
    <div className="relative min-h-screen bg-[color:var(--navy)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(196,164,124,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(196,164,124,0.08), transparent 50%)",
        }}
      />

      <section className="page-offset relative px-6 pb-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.35em] text-[color:var(--gold)] uppercase">
            Free valuation
          </p>
          <h1 className="mt-4 font-display text-5xl tracking-wide text-[color:var(--gold)] md:text-6xl">
            Market value
          </h1>
          <p className={`mx-auto mt-4 max-w-xl text-base leading-relaxed ${mutedText}`}>
            Instant sold-price insight from HM Land Registry — then unlock the
            figure with a valid email.
          </p>
        </div>
      </section>

      <section className="relative px-6 pb-24 lg:px-10">
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-sm border border-[color:var(--gold)]/35 bg-[color:var(--navy-light)]/90 shadow-[0_0_0_1px_rgba(196,164,124,0.08)] backdrop-blur-sm">
            {/* Progress */}
            <div className="flex border-b border-[color:var(--gold)]/25">
              {(
                [
                  ["intro", "Start"],
                  ["address", "Address"],
                  ["email", "Email"],
                  ["result", "Value"],
                ] as const
              ).map(([key, label], index) => {
                const order = ["intro", "address", "email", "result"] as Step[];
                const activeIndex = order.indexOf(step);
                const done = index <= activeIndex;
                return (
                  <div
                    key={key}
                    className={`flex-1 px-2 py-3 text-center text-[10px] tracking-[0.2em] uppercase sm:text-xs ${
                      done
                        ? "bg-[color:var(--gold)]/15 font-semibold text-[color:var(--gold)]"
                        : "text-[color:var(--gold)]/40"
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>

            <div className="p-8 sm:p-10">
              {step === "intro" ? (
                <div className="space-y-8 text-center">
                  <h2 className="font-display text-3xl text-[color:var(--gold)] md:text-4xl">
                    Do you want to find the market value for a house?
                  </h2>
                  <p className={`text-sm leading-relaxed ${mutedText}`}>
                    We’ll look up the latest Land Registry sold price for an
                    England &amp; Wales address. No obligation — just enter the
                    address to begin.
                  </p>
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={() => {
                        setError("");
                        setStep("address");
                      }}
                    >
                      Yes, find a value
                    </button>
                    <a href="/contact?reason=valuation" className={btnGhost}>
                      Speak to us instead
                    </a>
                  </div>
                </div>
              ) : null}

              {step === "address" ? (
                <form onSubmit={onAddress} className="space-y-6">
                  <div>
                    <h2 className="font-display text-3xl text-[color:var(--gold)]">
                      Enter the property address
                    </h2>
                    <p className={`mt-2 text-sm ${mutedText}`}>
                      Include the house number and street. A full UK postcode
                      helps us match accurately.
                    </p>
                  </div>
                  <label className="block">
                    <span className={labelClass}>Address *</span>
                    <input
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 12 Bennett Road, Leeds"
                      className={fieldClass}
                      autoComplete="street-address"
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Postcode *</span>
                    <input
                      required
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="e.g. LS6 3HN"
                      className={fieldClass}
                      autoComplete="postal-code"
                    />
                  </label>
                  {error ? <p className={errorClass}>{error}</p> : null}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className={btnPrimary}
                      disabled={loading}
                    >
                      {loading ? "Searching…" : "Find market value"}
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setError("");
                        setStep("intro");
                      }}
                    >
                      Back
                    </button>
                  </div>
                </form>
              ) : null}

              {step === "email" && pending ? (
                <form onSubmit={onEmail} className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.25em] text-[color:var(--gold)] uppercase">
                      Property found
                    </p>
                    <h2 className="mt-2 font-display text-3xl text-[color:var(--gold)]">
                      Unlock your figure
                    </h2>
                    <p className={`mt-2 text-sm ${mutedText}`}>
                      We found a Land Registry record for{" "}
                      <span className="font-medium text-[color:var(--gold)]">
                        {pending.matchedAddress}
                      </span>
                      . Enter a valid email to reveal the sold price.
                    </p>
                  </div>
                  <label className="block">
                    <span className={labelClass}>Email *</span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className={fieldClass}
                      autoComplete="email"
                    />
                  </label>
                  <p className="text-xs text-white/45">
                    We check the address format and that the email domain can
                    receive mail — we don’t send a message to verify ownership.
                  </p>
                  {error ? <p className={errorClass}>{error}</p> : null}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className={btnPrimary}
                      disabled={loading}
                    >
                      {loading ? "Checking email…" : "Show market value"}
                    </button>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setError("");
                        setPending(null);
                        setStep("address");
                      }}
                    >
                      Try another address
                    </button>
                  </div>
                </form>
              ) : null}

              {step === "result" && pending ? (
                <div className="space-y-8 text-center">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.25em] text-[color:var(--gold)] uppercase">
                      Latest sold price
                    </p>
                    <p className={`mt-3 text-sm ${mutedText}`}>
                      {pending.matchedAddress}
                    </p>
                    <p
                      className="mt-6 font-display text-5xl tracking-wide md:text-6xl"
                      style={{ color: gold }}
                    >
                      {formatGbp(pending.latest.amount)}
                    </p>
                    <p className={`mt-3 text-sm ${mutedText}`}>
                      Recorded{" "}
                      {new Date(pending.latest.date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                      {pending.latest.propertyType
                        ? ` · ${pending.latest.propertyType}`
                        : ""}
                    </p>
                  </div>

                  {pending.history.length > 1 ? (
                    <div className="border-t border-[color:var(--gold)]/25 pt-6 text-left">
                      <p className="text-xs font-semibold tracking-[0.2em] text-[color:var(--gold)] uppercase">
                        Earlier sales
                      </p>
                      <ul className="mt-3 space-y-2">
                        {pending.history.slice(1).map((sale) => (
                          <li
                            key={`${sale.date}-${sale.amount}`}
                            className={`flex justify-between gap-4 text-sm ${mutedText}`}
                          >
                            <span>
                              {new Date(sale.date).toLocaleDateString("en-GB")}
                            </span>
                            <span className="font-medium text-[color:var(--gold)]">
                              {formatGbp(sale.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <p className="text-left text-[11px] leading-relaxed text-white/40">
                    {pending.attribution} This is the registered sold price, not
                    a formal RICS valuation or live asking-price estimate.
                    Markets change — book a free local valuation for a current
                    opinion of value.
                  </p>

                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <a href="/contact?reason=valuation" className={btnPrimary}>
                      Contact us to book a visit
                    </a>
                    <button type="button" className={btnGhost} onClick={resetFlow}>
                      Check another property
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
