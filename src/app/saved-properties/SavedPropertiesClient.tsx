"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Property } from "@/data/properties";

export function SavedPropertiesClient() {
  const router = useRouter();
  const { ready, session, savedSlugs, toggleSave, isAdmin } = useAuth();
  const [saved, setSaved] = useState<Property[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (ready && isAdmin) {
      router.replace("/admin");
      return;
    }
    if (ready && !session) {
      router.replace("/login?next=/saved-properties#login-form");
    }
  }, [isAdmin, ready, router, session]);

  useEffect(() => {
    if (!ready || !session || isAdmin) return;

    if (savedSlugs.length === 0) {
      setSaved([]);
      setLoadingList(false);
      return;
    }

    const controller = new AbortController();
    setLoadingList(true);
    const qs = encodeURIComponent(savedSlugs.join(","));
    void fetch(`/api/properties?slugs=${qs}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { properties?: Property[] }) => {
        setSaved(Array.isArray(data.properties) ? data.properties : []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSaved([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingList(false);
      });

    return () => controller.abort();
  }, [isAdmin, ready, savedSlugs, session]);

  if (!ready || !session || isAdmin) {
    return (
      <div className="pt-36 px-6 text-center text-[color:var(--muted)]">
        Loading saved properties…
      </div>
    );
  }

  return (
    <div className="page-offset">
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-5xl text-white">
            My Saved Properties
          </h1>
          <p className="mt-4 text-[color:var(--muted)]">
            Your shortlist of homes — details loaded from live listings.
          </p>

          {loadingList ? (
            <p className="mt-12 text-[color:var(--muted)]">
              Loading your shortlist…
            </p>
          ) : saved.length === 0 ? (
            <p className="mt-12 text-[color:var(--muted)]">
              {savedSlugs.length > 0
                ? "Those saved listings are no longer available."
                : "You have not saved any properties yet."}{" "}
              <Link
                href="/properties?type=rent"
                className="text-[color:var(--gold)]"
              >
                Browse listings
              </Link>{" "}
              and tap Save on homes you like.
            </p>
          ) : (
            <>
              <div className="mt-8">
                <Link
                  href="/properties?type=rent"
                  className="btn-outline-gold inline-block cursor-pointer px-6 py-3 text-sm uppercase"
                >
                  Add another property
                </Link>
              </div>
              <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {saved.map((property) => (
                  <article
                    key={property.slug}
                    className="border border-[color:var(--line)]"
                  >
                    <Link
                      href={`/properties/${property.slug}`}
                      className="block cursor-pointer"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={property.image}
                          alt={property.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="p-6">
                        <h2 className="font-display text-2xl text-white">
                          {property.title}
                        </h2>
                        <p className="mt-1 text-sm text-[color:var(--muted)]">
                          {property.location}
                        </p>
                        <p className="mt-3 text-lg text-white">
                          {property.price}
                        </p>
                        <p className="mt-2 text-xs text-[color:var(--muted)]">
                          {property.beds} bed · {property.baths} bath ·{" "}
                          {property.area}
                        </p>
                      </div>
                    </Link>
                    <div className="px-6 pb-6">
                      <button
                        type="button"
                        onClick={() => {
                          void toggleSave(property.slug);
                        }}
                        className="cursor-pointer text-sm text-[color:var(--gold)] transition-colors hover:text-white hover:underline"
                      >
                        Remove from shortlist
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
