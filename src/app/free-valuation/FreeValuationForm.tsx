"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { siteImages } from "@/data/hero-images";

export default function FreeValuationForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <div className="pt-28">
      <section className="relative h-[36vh] min-h-[280px] overflow-hidden">
        <Image
          src={siteImages.valuation}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--navy)] via-[color:var(--navy)]/70 to-[color:var(--navy)]/40" />
        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h1 className="font-display text-center text-5xl text-white md:text-6xl">
            Free Valuation
          </h1>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-lg text-[color:var(--muted)]">
            Find out what your property is worth. No obligation, no pressure —
            just expert local advice.
          </p>

          {sent ? (
            <p className="mt-12 text-center text-lg text-white">
              Thank you. A member of our team will contact you within 24 hours
              to arrange your valuation.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-12 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-white">First name *</span>
                  <input
                    required
                    className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-white">Last name *</span>
                  <input
                    required
                    className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm text-white">Email *</span>
                <input
                  type="email"
                  required
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white">Phone *</span>
                <input
                  type="tel"
                  required
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white">Property address *</span>
                <input
                  required
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              <label className="block">
                <span className="text-sm text-white">Postcode *</span>
                <input
                  required
                  className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
                />
              </label>
              <button
                type="submit"
                className="btn-gold w-full py-4 text-sm font-medium uppercase md:w-auto md:px-12"
              >
                Request valuation
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
