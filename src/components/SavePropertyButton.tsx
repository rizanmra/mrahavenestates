"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function SavePropertyButton({ slug }: { slug: string }) {
  const { session, isSaved, toggleSave } = useAuth();
  const saved = session ? isSaved(slug) : false;

  if (!session) {
    return (
      <Link
        href={`/login?next=/properties/${slug}`}
        className="btn-outline-gold inline-block px-8 py-3 text-sm uppercase"
      >
        Save this property
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        void toggleSave(slug);
      }}
      className={
        saved
          ? "inline-block border border-[color:var(--gold)] bg-[color:var(--gold)] px-8 py-3 text-sm uppercase text-[color:var(--navy)]"
          : "btn-outline-gold px-8 py-3 text-sm uppercase"
      }
    >
      {saved ? "Saved to shortlist" : "Save this property"}
    </button>
  );
}
