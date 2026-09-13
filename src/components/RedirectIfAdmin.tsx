"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";

type Props = {
  children: ReactNode;
  /** Where to send staff instead of the client page. */
  href?: string;
  /** If true, show a short notice instead of auto-redirecting. */
  soft?: boolean;
};

export function RedirectIfAdmin({
  children,
  href = "/admin",
  soft = false,
}: Props) {
  const router = useRouter();
  const { ready, isAdmin } = useAuth();

  useEffect(() => {
    if (!soft && ready && isAdmin) {
      router.replace(href);
    }
  }, [href, isAdmin, ready, router, soft]);

  if (isAdmin) {
    return (
      <div className="page-offset mx-auto max-w-xl px-6 py-20 text-center lg:px-10">
        <p className="text-xs tracking-[0.2em] text-[color:var(--gold)] uppercase">
          Staff account
        </p>
        <h1 className="font-display mt-4 text-4xl text-white">
          Client enquiry form
        </h1>
        <p className="mt-4 text-[color:var(--muted)]">
          You&apos;re signed in as staff. Enquiries and Contact Us are for
          clients — open the staff portal to manage listings and resolve inbox
          messages instead.
        </p>
        <Link
          href={href}
          className="btn-gold mt-10 inline-block px-8 py-3 text-sm font-medium uppercase"
        >
          Open staff portal
        </Link>
      </div>
    );
  }

  return children;
}
