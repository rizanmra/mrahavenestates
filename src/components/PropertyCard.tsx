"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Property } from "@/data/properties";

export function PropertyCard({ property }: { property: Property }) {
  const { session, isSaved, toggleSave, isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);
  const saved = Boolean(session && isSaved(property.slug));

  async function onToggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!session || busy || isAdmin) return;
    setBusy(true);
    try {
      await Promise.resolve(toggleSave(property.slug));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="group relative overflow-hidden border border-[color:var(--line)] transition-colors hover:border-[color:var(--gold)]">
      <Link href={`/properties/${property.slug}`} className="block cursor-pointer">
        <div className="relative aspect-[4/3]">
          <Image
            src={property.image}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {saved ? (
            <span className="absolute top-3 right-3 z-10 bg-[color:var(--gold)] px-3 py-1 text-xs font-semibold tracking-wide text-[color:var(--navy)] uppercase">
              Saved
            </span>
          ) : null}
        </div>
        <div className="p-6 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[color:var(--gold)]">
              {property.status}
            </span>
            {saved ? (
              <span className="text-xs text-white/70">· On your shortlist</span>
            ) : null}
          </div>
          <h2 className="font-display mt-2 text-2xl text-white group-hover:text-[color:var(--gold)]">
            {property.title}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {property.location}
          </p>
          <p className="mt-3 text-lg text-white">{property.price}</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            {property.beds} {property.beds === 1 ? "bedroom" : "bedrooms"} ·{" "}
            {property.baths} {property.baths === 1 ? "bath" : "baths"} ·{" "}
            {property.area}
          </p>
        </div>
      </Link>

      <div className="px-6 pb-6">
        {isAdmin ? null : !session ? (
          <Link
            href={`/login?next=/properties/${property.slug}#login-form`}
            className="btn-outline-gold inline-block cursor-pointer px-4 py-2 text-xs uppercase"
          >
            Save this property
          </Link>
        ) : saved ? (
          <button
            type="button"
            disabled={busy}
            onClick={onToggle}
            title="Remove from shortlist"
            aria-label="Remove from shortlist"
            className="group/save relative cursor-pointer border border-[color:var(--gold)] bg-[color:var(--gold)] px-4 py-2 text-xs font-semibold tracking-wide text-[color:var(--navy)] uppercase transition-colors hover:bg-transparent hover:text-[color:var(--gold)] disabled:opacity-70"
          >
            {busy ? (
              "Updating…"
            ) : (
              <>
                <span className="group-hover/save:hidden">Saved to shortlist</span>
                <span className="hidden group-hover/save:inline">
                  Remove from shortlist
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={onToggle}
            className="btn-outline-gold cursor-pointer px-4 py-2 text-xs uppercase disabled:opacity-70"
          >
            {busy ? "Saving…" : "Save this property"}
          </button>
        )}
      </div>
    </div>
  );
}
