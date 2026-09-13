"use client";

import { useAuth } from "@/components/AuthProvider";
import { PublicInboxLink } from "@/components/PublicInboxLink";

export function PropertiesEmptyCopy({
  locationLabel,
  contactHref,
}: {
  locationLabel: string;
  contactHref: string;
}) {
  const { isAdmin } = useAuth();
  const intro = locationLabel
    ? `There's no property available at “${locationLabel}”.`
    : "There's no property available right now.";

  if (isAdmin) {
    return (
      <p className="mt-12 text-lg text-[color:var(--muted)]">{intro}</p>
    );
  }

  return (
    <p className="mt-12 text-lg text-[color:var(--muted)]">
      {intro}{" "}
      <PublicInboxLink href={contactHref} className="text-[color:var(--gold)]">
        Contact us
      </PublicInboxLink>{" "}
      and we will help you find the right home.
    </p>
  );
}
