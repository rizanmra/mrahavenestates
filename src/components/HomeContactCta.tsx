"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { ClientPortalCta } from "@/components/ClientPortalCta";
import { site } from "@/data/site";

export function HomeContactCta() {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return (
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/admin"
          className="btn-gold inline-block px-10 py-4 text-sm tracking-wide uppercase"
        >
          Open staff portal
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-6 text-lg text-[color:var(--muted)]">
        Ready to move? Speak to our team today on{" "}
        <a href={site.phoneHref} className="text-[color:var(--gold)]">
          {site.phone}
        </a>
        .
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/contact?reason=general"
          className="btn-outline-gold inline-block px-10 py-4 text-sm tracking-wide uppercase"
        >
          Get in touch
        </Link>
        <ClientPortalCta className="btn-gold inline-block px-10 py-4 text-sm tracking-wide uppercase" />
      </div>
    </>
  );
}
