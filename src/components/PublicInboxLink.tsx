"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isClientInboxHref } from "@/data/navigation";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Client Contact / Enquire CTAs. Hidden for staff — those messages go to admin. */
export function PublicInboxLink({ href, className, children }: Props) {
  const { isAdmin } = useAuth();

  if (isClientInboxHref(href) && isAdmin) {
    return null;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
