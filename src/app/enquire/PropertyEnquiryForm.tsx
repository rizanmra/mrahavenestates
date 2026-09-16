"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { seedProperties, type Property } from "@/data/properties";
import { firebaseCreatePropertyEnquiry } from "@/lib/firebase-auth";
import {
  formatPhoneForStorage,
  maskEmail,
  maskPhone,
  validateEmail,
  validateName,
  validatePhone,
} from "@/lib/form-validation";
import type { PropertyEnquiryRecord } from "@/lib/property-enquiry";

function propertyPayload(property: Property) {
  return {
    slug: property.slug,
    title: property.title,
    location: property.location,
    price: property.price,
    status: property.status,
    type: property.type,
    beds: property.beds,
    baths: property.baths,
    area: property.area,
  };
}

export default function PropertyEnquiryForm() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("property") ?? "";
  const [listings, setListings] = useState<Property[]>(seedProperties);
  const [selectedSlug, setSelectedSlug] = useState(() =>
    seedProperties.some((item) => item.slug === initialSlug) ? initialSlug : "",
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { session, recordEnquiry } = useAuth();
  const loggedIn = Boolean(session);

  useEffect(() => {
    void fetch("/api/properties")
      .then((res) => res.json())
      .then((data: { properties?: Property[] }) => {
        const list = Array.isArray(data.properties) ? data.properties : [];
        const next = list.length > 0 ? list : seedProperties;
        setListings(next);
        const slug = searchParams.get("property") ?? "";
        if (next.some((item) => item.slug === slug)) {
          setSelectedSlug(slug);
        } else if (!next.some((item) => item.slug === selectedSlug)) {
          setSelectedSlug("");
        }
      })
      .catch(() => {
        setListings((current) => (current.length > 0 ? current : seedProperties));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selected = useMemo(
    () => listings.find((item) => item.slug === selectedSlug),
    [listings, selectedSlug],
  );

  const sorted = useMemo(
    () =>
      [...listings].sort((a, b) => a.title.localeCompare(b.title, "en-GB")),
    [listings],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    if (!message) {
      setError("Please enter a message.");
      return;
    }

    const property = selected;
    if (!property) {
      setError("Please select a property to enquire about.");
      return;
    }

    let name = "";
    let email = "";
    let phone = "";

    if (loggedIn && session) {
      name = session.name;
      email = session.email;
      phone = session.phone || "";
    } else {
      name = String(form.get("name") ?? "");
      email = String(form.get("email") ?? "");
      phone = String(form.get("phone") ?? "");
      const nameError = validateName(name);
      const emailError = validateEmail(email);
      const phoneError = validatePhone(phone, true);
      const firstError = nameError || emailError || phoneError;
      if (firstError) {
        setError(firstError);
        return;
      }
      phone = formatPhoneForStorage(phone);
      name = name.trim().replace(/\s+/g, " ");
      email = email.trim().toLowerCase();
    }

    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          source: "property-enquiry",
          allowMissingPhone: loggedIn,
          property: propertyPayload(property),
        }),
      });
      const raw = await res.text();
      let data: {
        ok?: boolean;
        error?: string;
        enquiry?: PropertyEnquiryRecord;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setError(
          res.status >= 500
            ? "The enquiry service is temporarily unavailable. Please call us or try again shortly."
            : "Could not send your message. Please try again.",
        );
        return;
      }
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not send your message. Please try again.");
        return;
      }

      if (data.enquiry) {
        void firebaseCreatePropertyEnquiry(data.enquiry);
      }

      const summary = `${property.title} — ${message}`;
      recordEnquiry("property", summary, {
        sourceEnquiryId: data.enquiry?.id,
        status: "open",
      });
      setSent(true);
    } catch {
      setError("Could not send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-offset">
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2">
          <div>
            <p className="text-xs tracking-[0.25em] text-[color:var(--gold)] uppercase">
              Property enquiry
            </p>
            <h1 className="font-display mt-4 text-5xl text-white md:text-6xl">
              Enquire
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">
              Ask about a home for sale or to rent — viewings, availability or
              further details. Your message goes to our staff inbox with the
              listing attached.
            </p>
            <p className="mt-6 text-sm text-[color:var(--muted)]">
              For general questions unrelated to a listing, use{" "}
              <Link
                href="/contact?reason=general"
                className="text-[color:var(--gold)] transition-colors hover:text-white"
              >
                Contact us
              </Link>
              .
            </p>

            {selected ? (
              <div className="mt-10 overflow-hidden border border-[color:var(--line)]">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={selected.image}
                    alt={selected.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
                <div className="space-y-2 bg-[color:var(--navy-light)] p-5">
                  <p className="text-sm text-[color:var(--gold)]">
                    {selected.status} · {selected.location}
                  </p>
                  <p className="font-display text-2xl text-white">
                    {selected.title}
                  </p>
                  <p className="text-lg text-white">{selected.price}</p>
                  <Link
                    href={`/properties/${selected.slug}`}
                    className="inline-block pt-2 text-sm text-[color:var(--gold)] transition-colors hover:text-white"
                  >
                    View listing →
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {sent ? (
            <p className="self-center text-lg text-white">
              Thank you for your property enquiry. We will respond within one
              working day.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <label className="block">
                <span className="text-sm text-white">Property *</span>
                <select
                  required
                  name="property"
                  value={selectedSlug}
                  onChange={(event) => setSelectedSlug(event.target.value)}
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                >
                  <option value="" className="bg-[color:var(--navy)]">
                    Select a property
                  </option>
                  {sorted.map((property) => (
                    <option
                      key={property.slug}
                      value={property.slug}
                      className="bg-[color:var(--navy)]"
                    >
                      {property.title} — {property.location} ({property.price})
                    </option>
                  ))}
                </select>
              </label>

              {loggedIn && session ? (
                <div className="space-y-4 border border-[color:var(--line)] bg-[color:var(--navy-light)] p-5">
                  <p className="text-xs tracking-[0.25em] text-[color:var(--gold)] uppercase">
                    What we&apos;ll send
                  </p>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-[color:var(--muted)]">Name</dt>
                      <dd className="mt-1 text-white">{session.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[color:var(--muted)]">Email</dt>
                      <dd className="mt-1 text-white">
                        {maskEmail(session.email)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[color:var(--muted)]">Phone</dt>
                      <dd className="mt-1 text-white">
                        {session.phone
                          ? maskPhone(session.phone)
                          : "Not on file"}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <>
                  <label className="block">
                    <span className="text-sm text-white">Name *</span>
                    <input
                      required
                      name="name"
                      autoComplete="name"
                      className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-white">Email *</span>
                    <input
                      required
                      type="email"
                      name="email"
                      autoComplete="email"
                      className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-white">Phone *</span>
                    <input
                      required
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      placeholder="07xxx xxx xxx"
                      className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                    />
                  </label>
                </>
              )}

              <label className="block">
                <span className="text-sm text-white">Message *</span>
                <textarea
                  required
                  name="message"
                  rows={5}
                  placeholder="Ask about a viewing, availability, or further details…"
                  className="mt-2 w-full border border-[color:var(--line)] bg-transparent p-3 text-white outline-none placeholder:text-white/35 focus:border-[color:var(--gold)]"
                />
              </label>

              {error ? <p className="text-sm text-error">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="btn-gold px-10 py-3 text-sm font-medium uppercase disabled:opacity-70"
              >
                {busy ? "Sending…" : "Send property enquiry"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
