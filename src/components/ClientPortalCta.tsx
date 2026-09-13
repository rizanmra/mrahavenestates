"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function ClientPortalCta({
  className,
}: {
  className?: string;
}) {
  const { session, isAdmin } = useAuth();

  if (session) {
    return (
      <Link href={isAdmin ? "/admin" : "/account"} className={className}>
        {isAdmin ? "Staff portal" : "My Account"}
      </Link>
    );
  }

  return (
    <Link
      href="/login#login-form"
      scroll={false}
      onClick={() => {
        try {
          sessionStorage.setItem("mra-scroll-login-form", "1");
        } catch {
          // ignore
        }
      }}
      className={className}
    >
      Client login
    </Link>
  );
}
