"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  contactReasons,
  getContactReason,
  isContactReasonId,
} from "@/data/contact-reasons";
import { site } from "@/data/site";
import {
  formatPhoneForStorage,
  maskEmail,
  maskPhone,
  validateEmail,
  validateName,
  validatePhone,
} from "@/lib/form-validation";

export default function ContactForm() {
  const searchParams = useSearchParams();
  const initialReason = (() => {
    const fromQuery = searchParams.get("reason")?.trim() || "general";
    return isContactReasonId(fromQuery) ? fromQuery : "general";
  })();

  const [reason, setReason] = useState(initialReason);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { session, recordEnquiry } = useAuth();
  const loggedIn = Boolean(session);

  useEffect(() => {
    const fromQuery = searchParams.get("reason")?.trim() || "general";
    setReason(isContactReasonId(fromQuery) ? fromQuery : "general");
  }, [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    const selectedReason = String(form.get("reason") ?? reason).trim();
    if (!message) {
      setError("Please enter a message.");
      return;
    }
    if (!isContactReasonId(selectedReason)) {
      setError("Please select a reason for your enquiry.");
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
          source: "contact",
          reason: selectedReason,
          allowMissingPhone: loggedIn,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not send your message. Please try again.");
        return;
      }

      const reasonLabel = getContactReason(selectedReason).label;
      const summary = loggedIn
        ? `${reasonLabel}: ${message}`
        : `${reasonLabel}: ${message} — ${name}`;
      recordEnquiry("contact", summary);
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
            <h1 className="font-display text-5xl text-white md:text-6xl">
              Contact
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">
              Get in touch with our team for sales, lettings, removals or
              general enquiries. Messages from this form are emailed to the
              office with your selected reason in the subject line.
            </p>
            <p className="mt-4 text-sm text-[color:var(--muted)]">
              Asking about a specific listing? Use{" "}
              <Link
                href="/enquire"
                className="text-[color:var(--gold)] transition-colors hover:text-white"
              >
                property enquiry
              </Link>{" "}
              instead.
            </p>
            <div className="mt-10 space-y-4 text-white">
              <p>
                <span className="text-[color:var(--muted)]">Phone: </span>
                <a
                  href={site.phoneHref}
                  className="cursor-pointer transition-colors hover:text-[color:var(--gold)]"
                >
                  {site.phone}
                </a>
              </p>
              <p>
                <span className="text-[color:var(--muted)]">Email: </span>
                <a
                  href={`mailto:${site.email}`}
                  className="cursor-pointer transition-colors hover:text-[color:var(--gold)]"
                >
                  {site.email}
                </a>
              </p>
              <address className="not-italic leading-relaxed text-[color:var(--muted)]">
                {site.address.line1}
                <br />
                {site.address.line2}
                <br />
                {site.address.city}
                <br />
                {site.address.postcode}
              </address>
            </div>
          </div>

          {sent ? (
            <p className="self-center text-lg text-white">
              Thank you for your message. We will respond within one working
              day.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              {loggedIn && session ? (
                <div className="space-y-4 border border-[color:var(--line)] bg-[color:var(--navy-light)] p-5">
                  <p className="text-xs tracking-[0.25em] text-[color:var(--gold)] uppercase">
                    What we&apos;ll send
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">
                    These details come from your account. Choose a reason and
                    write your message below.
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
                <span className="text-sm text-white">Reason for contact *</span>
                <select
                  required
                  name="reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)] [&>option]:bg-[color:var(--navy)]"
                >
                  {contactReasons.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-white">Message *</span>
                <textarea
                  required
                  name="message"
                  rows={5}
                  className="mt-2 w-full border border-[color:var(--line)] bg-transparent p-3 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              {error ? <p className="text-sm text-error">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="btn-gold px-10 py-3 text-sm font-medium uppercase disabled:opacity-70"
              >
                {busy ? "Sending…" : "Send enquiry"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
