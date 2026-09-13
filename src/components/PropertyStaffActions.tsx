"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { SavePropertyButton } from "@/components/SavePropertyButton";

type Props = {
  slug: string;
};

/** Client CTAs on a listing: enquire/save for public; manage for staff. */
export function PropertyStaffActions({ slug }: Props) {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return (
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/admin?tab=listings"
          className="btn-gold inline-block px-8 py-3 text-sm font-medium uppercase"
        >
          Edit in staff portal
        </Link>
        <Link
          href="/admin?tab=enquiries"
          className="btn-outline-gold inline-block px-8 py-3 text-sm font-medium uppercase"
        >
          View enquiries
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-wrap gap-4">
      <Link
        href={`/enquire?property=${slug}`}
        className="btn-gold inline-block px-8 py-3 text-sm font-medium uppercase"
      >
        Enquire about this property
      </Link>
      <SavePropertyButton slug={slug} />
    </div>
  );
}
