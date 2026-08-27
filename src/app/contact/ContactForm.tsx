"use client";

import { FormEvent, useState } from "react";
import { site } from "@/data/site";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <div className="pt-28">
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-5xl text-white md:text-6xl">
              Contact
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[color:var(--muted)]">
              Get in touch with our team for sales, lettings, removals or
              general enquiries.
            </p>
            <div className="mt-10 space-y-4 text-white">
              <p>
                <span className="text-[color:var(--muted)]">Phone: </span>
                <a
                  href={`tel:${site.phone}`}
                  className="hover:text-[color:var(--gold)]"
                >
                  {site.phone}
                </a>
              </p>
              <p>
                <span className="text-[color:var(--muted)]">Email: </span>
                <a
                  href={`mailto:${site.email}`}
                  className="hover:text-[color:var(--gold)]"
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
            <form onSubmit={onSubmit} className="space-y-6">
              <label className="block">
                <span className="text-sm text-white">Name *</span>
                <input
                  required
                  name="name"
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white">Email *</span>
                <input
                  required
                  type="email"
                  name="email"
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white">Phone</span>
                <input
                  type="tel"
                  name="phone"
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
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
              <button
                type="submit"
                className="btn-gold px-10 py-3 text-sm font-medium uppercase"
              >
                Send enquiry
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
