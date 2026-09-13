"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export function SavePropertyButton({ slug }: { slug: string }) {
  const { session, isSaved, toggleSave, isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saved = session ? isSaved(slug) : false;

  // Staff manage the catalogue — shortlist is for clients only.
  if (isAdmin) return null;

  if (!session) {
    return (
      <Link
        href={`/login?next=/properties/${slug}#login-form`}
        className="btn-outline-gold inline-block cursor-pointer px-8 py-3 text-sm uppercase"
      >
        Save this property
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        title={saved ? "Remove from shortlist" : "Save this property"}
        aria-label={saved ? "Remove from shortlist" : "Save this property"}
        onClick={() => {
          setError("");
          setBusy(true);
          const work = Promise.resolve(toggleSave(slug));
          const timeout = new Promise<never>((_, reject) => {
            window.setTimeout(() => {
              reject(
                new Error(
                  "Could not save this property just now. Please try again.",
                ),
              );
            }, 12000);
          });

          void Promise.race([work, timeout])
            .catch((err) => {
              setError(
                err instanceof Error
                  ? err.message
                  : "Could not update your shortlist.",
              );
            })
            .finally(() => setBusy(false));
        }}
        className={
          saved
            ? "group/save relative inline-block cursor-pointer border border-[color:var(--gold)] bg-[color:var(--gold)] px-8 py-3 text-sm uppercase text-[color:var(--navy)] transition-colors hover:bg-transparent hover:text-[color:var(--gold)] disabled:opacity-70"
            : "btn-outline-gold cursor-pointer px-8 py-3 text-sm uppercase disabled:opacity-70"
        }
      >
        {busy ? (
          "Updating…"
        ) : saved ? (
          <>
            <span className="group-hover/save:hidden">Saved to shortlist</span>
            <span className="hidden group-hover/save:inline">
              Remove from shortlist
            </span>
          </>
        ) : (
          "Save this property"
        )}
      </button>
      {error ? <p className="max-w-md text-sm text-error">{error}</p> : null}
    </div>
  );
}
