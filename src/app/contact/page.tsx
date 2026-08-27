"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <section className="px-5 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
        <div>
          <p className="text-xs tracking-[0.28em] text-[color:var(--gold)] uppercase">
            Enquiries
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl">
            Contact
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-[color:var(--muted)]">
            This form is on the page now so the site feels complete. Later it
            can save messages in Convex and email the office.
          </p>
        </div>

        {sent ? (
          <p className="self-center text-lg leading-8">
            Thank you. We will connect this form to a live inbox in the next
            phase. For now, email hello@mraheavenestates.com.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <label className="text-sm">
              Name
              <input
                required
                name="name"
                className="mt-2 w-full border border-[color:var(--line)] bg-white/70 px-4 py-3 outline-none"
              />
            </label>
            <label className="text-sm">
              Email
              <input
                required
                type="email"
                name="email"
                className="mt-2 w-full border border-[color:var(--line)] bg-white/70 px-4 py-3 outline-none"
              />
            </label>
            <label className="text-sm">
              Message
              <textarea
                required
                name="message"
                rows={5}
                className="mt-2 w-full border border-[color:var(--line)] bg-white/70 px-4 py-3 outline-none"
              />
            </label>
            <button
              type="submit"
              className="mt-2 rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm tracking-[0.16em] text-[color:var(--cream)] uppercase"
            >
              Send enquiry
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
