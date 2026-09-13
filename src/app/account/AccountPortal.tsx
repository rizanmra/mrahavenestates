"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { site } from "@/data/site";
import {
  consumeNewSignupWelcome,
  filterOwnEnquiries,
  formatEnquiryWhen,
} from "@/lib/portal";

export function AccountPortal() {
  const router = useRouter();
  const { ready, session, logout, savedSlugs, enquiries, isAdmin } = useAuth();
  const [isNewSignup] = useState(() => consumeNewSignupWelcome());

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      const timer = window.setTimeout(() => {
        router.replace("/login?next=/account#login-form");
      }, 500);
      return () => window.clearTimeout(timer);
    }
    if (isAdmin) {
      router.replace("/admin");
    }
    return undefined;
  }, [isAdmin, ready, router, session]);

  if (!ready || !session || isAdmin) {
    return (
      <div className="pt-36 px-6 text-center text-[color:var(--muted)]">
        Loading your portal…
      </div>
    );
  }

  const savedCount = savedSlugs.length;
  const myEnquiries = filterOwnEnquiries(
    session.userId,
    session.email,
    enquiries,
  );

  const fullName = session.name.trim() || "Client";
  const greeting = isNewSignup
    ? `Welcome, ${fullName}`
    : `Welcome back, ${fullName}`;

  return (
    <div className="page-offset">
      <section className="border-b border-[color:var(--line)] bg-[color:var(--navy-light)] px-6 py-16 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] text-[color:var(--gold)] uppercase">
              Client portal
            </p>
            <h1 className="font-display mt-3 text-4xl text-white md:text-5xl">
              {greeting}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="btn-outline-gold cursor-pointer px-6 py-3 text-sm uppercase"
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
              {savedCount}
            </p>
            <Link
              href="/saved-properties"
              className="mt-4 inline-block cursor-pointer text-sm text-[color:var(--gold)] transition-colors hover:text-white hover:underline"
            >
              View shortlist →
            </Link>
            <Link
              href="/properties?type=rent"
              className="mt-2 block cursor-pointer text-sm text-white/70 transition-colors hover:text-[color:var(--gold)] hover:underline"
            >
              Add another property →
            </Link>
          </div>
          <div className="border border-[color:var(--line)] p-6">
            <p className="text-sm text-[color:var(--gold)]">Enquiries</p>
            <p className="font-display mt-2 text-4xl text-white">
              {myEnquiries.length}
            </p>
            <Link
              href="/enquire"
              className="mt-4 inline-block cursor-pointer text-sm text-[color:var(--gold)] transition-colors hover:text-white hover:underline"
            >
              New enquiry →
            </Link>
          </div>
          <div className="border border-[color:var(--line)] p-6">
            <p className="text-sm text-[color:var(--gold)]">Speak to us</p>
            <a
              href={site.phoneHref}
              className="mt-2 block cursor-pointer text-xl text-white transition-colors hover:text-[color:var(--gold)]"
            >
              {site.phone}
            </a>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Bradford office · {site.address.postcode}
            </p>
            <div className="mt-4 space-y-2">
              <Link
                href="/contact?reason=general"
                className="block cursor-pointer text-sm text-[color:var(--gold)] transition-colors hover:text-white hover:underline"
              >
                Get in touch →
              </Link>
              <Link
                href="/contact?reason=mortgage"
                className="block cursor-pointer text-sm text-white/70 transition-colors hover:text-[color:var(--gold)] hover:underline"
              >
                Mortgage advice →
              </Link>
              <Link
                href="/contact?reason=auction"
                className="block cursor-pointer text-sm text-white/70 transition-colors hover:text-[color:var(--gold)] hover:underline"
              >
                Auction enquiry →
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <h2 className="font-display text-3xl text-white">Recent enquiries</h2>
          {myEnquiries.length === 0 ? (
            <p className="mt-4 text-[color:var(--muted)]">
              No enquiries yet. Use the property enquiry, contact or valuation
              forms and they will appear here.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {myEnquiries.map((enquiry) => {
                const created = formatEnquiryWhen(enquiry.createdAt);
                const replied = formatEnquiryWhen(enquiry.repliedAt);
                return (
                  <li
                    key={enquiry.id}
                    className="border border-[color:var(--line)] p-4"
                  >
                    <p className="text-xs uppercase tracking-widest text-[color:var(--gold)]">
                      {enquiry.type}
                      {enquiry.status === "answered"
                        ? " · Answered"
                        : enquiry.status === "closed"
                          ? " · Closed"
                          : ""}
                    </p>
                    <p className="mt-2 text-white">{enquiry.summary}</p>
                    {enquiry.reply ? (
                      <div className="mt-3 border-t border-[color:var(--line)] pt-3">
                        <p className="text-xs uppercase tracking-widest text-[color:var(--gold)]">
                          {enquiry.status === "closed"
                            ? "Update from MRA Haven Estates"
                            : "Reply from MRA Haven Estates"}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-white/90">
                          {enquiry.reply}
                        </p>
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      {created}
                      {replied
                        ? enquiry.status === "closed"
                          ? ` · Closed ${replied}`
                          : ` · Replied ${replied}`
                        : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
