"use client";

import { FormEvent, useState } from "react";
import { validateEmail } from "@/lib/form-validation";

export function NewsletterForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const emailError = validateEmail(String(form.get("email") ?? ""));
    if (emailError) {
      setError(emailError);
      return;
    }
    setError("");
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
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <label className="block">
        <span className="text-sm text-white">Email *</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="mt-2 w-full border-b border-[color:var(--line)] bg-transparent py-2 text-white outline-none focus:border-[color:var(--gold)]"
        />
      </label>
      <label className="flex items-start gap-3 text-sm text-[color:var(--muted)]">
        <input type="checkbox" required className="mt-1" />
        <span>Yes, subscribe me to your newsletter. *</span>
      </label>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <button
        type="submit"
        className="btn-gold px-8 py-3 text-sm font-medium"
      >
        Submit
      </button>
    </form>
  );
}
