"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-sm text-[color:var(--muted)]">
        Thank you for subscribing. We will be in touch soon.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <label className="block">
        <span className="text-sm text-white">Email *</span>
        <input
          type="email"
          required
          className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
        />
      </label>
      <label className="flex items-start gap-3 text-sm text-[color:var(--muted)]">
        <input type="checkbox" required className="mt-1" />
        <span>Yes, subscribe me to your newsletter. *</span>
      </label>
      <button
        type="submit"
        className="btn-gold px-8 py-3 text-sm font-medium"
      >
        Submit
      </button>
    </form>
  );
}
