"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/data/properties";
import { site } from "@/data/site";

export function AccountPortal() {
  const router = useRouter();
  const { ready, session, logout, savedSlugs, enquiries } = useAuth();

  useEffect(() => {
    if (ready && !session) {
      router.replace("/login?next=/account");
    }
  }, [ready, router, session]);

  if (!ready || !session) {
    return (
      <div className="pt-36 px-6 text-center text-[color:var(--muted)]">
        Loading your portal…
      </div>
    );
  }

  const saved = savedSlugs
    .map((slug) => getProperty(slug))
    .filter((property) => Boolean(property));

  return (
    <div className="pt-28">
      <section className="border-b border-[color:var(--line)] bg-[color:var(--navy-light)] px-6 py-16 pt-32 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] text-[color:var(--gold)] uppercase">
              Client portal
            </p>
            <h1 className="font-display mt-3 text-4xl text-white md:text-5xl">
              Welcome back, {session.name.split(" ")[0]}
            </h1>
            <p className="mt-3 text-[color:var(--muted)]">{session.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="btn-outline-gold px-6 py-3 text-sm uppercase"
          >
            Sign out
          </button>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <div className="border border-[color:var(--line)] p-6">
            <p className="text-sm text-[color:var(--gold)]">Saved properties</p>
            <p className="font-display mt-2 text-4xl text-white">
              {saved.length}
            </p>
            <Link
              href="/saved-properties"
              className="mt-4 inline-block text-sm text-[color:var(--gold)]"
            >
              View shortlist →
            </Link>
          </div>
          <div className="border border-[color:var(--line)] p-6">
            <p className="text-sm text-[color:var(--gold)]">Enquiries</p>
            <p className="font-display mt-2 text-4xl text-white">
              {enquiries.length}
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block text-sm text-[color:var(--gold)]"
            >
              New enquiry →
            </Link>
          </div>
          <div className="border border-[color:var(--line)] p-6">
            <p className="text-sm text-[color:var(--gold)]">Speak to us</p>
            <a
              href={site.phoneHref}
              className="mt-2 block text-xl text-white hover:text-[color:var(--gold)]"
            >
              {site.phone}
            </a>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Bradford office · {site.address.postcode}
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <h2 className="font-display text-3xl text-white">Recent enquiries</h2>
          {enquiries.length === 0 ? (
            <p className="mt-4 text-[color:var(--muted)]">
              No enquiries yet. Use the contact or valuation forms and they will
              appear here.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {enquiries.map((enquiry) => (
                <li
                  key={enquiry.id}
                  className="border border-[color:var(--line)] p-4"
                >
                  <p className="text-xs uppercase tracking-widest text-[color:var(--gold)]">
                    {enquiry.type}
                  </p>
                  <p className="mt-2 text-white">{enquiry.summary}</p>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {new Date(enquiry.createdAt).toLocaleString("en-GB")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
