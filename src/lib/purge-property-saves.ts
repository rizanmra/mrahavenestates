import { getAdminFirestore } from "@/lib/firebase-admin";
import { listProperties } from "@/lib/listings-store";

const META_DOC = "meta/propertyCatalogue";

let syncInFlight: Promise<{ removed: string[]; purgedUsers: number }> | null =
  null;

/**
 * Remove a property slug from every user's savedProperties array.
 * Runs with Firebase Admin (server-only).
 */
export async function purgePropertyFromAllUsers(slug: string): Promise<number> {
  const db = getAdminFirestore();
  if (!db) return 0;

  const snap = await db.collection("users").get();
  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const saved = data.savedProperties;
    if (!Array.isArray(saved) || !saved.includes(slug)) continue;

    const next = saved.filter(
      (item): item is string => typeof item === "string" && item !== slug,
    );
    batch.set(doc.ref, { savedProperties: next }, { merge: true });
    updated += 1;
    ops += 1;

    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  return updated;
}

/**
 * When a listing slug changes, rewrite saved shortlists to the new slug
 * so clients keep the property instead of a dead link.
 */
export async function renamePropertyInAllUsers(
  previousSlug: string,
  nextSlug: string,
): Promise<number> {
  if (!previousSlug || !nextSlug || previousSlug === nextSlug) return 0;
  const db = getAdminFirestore();
  if (!db) return 0;

  const snap = await db.collection("users").get();
  let updated = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const saved = data.savedProperties;
    if (!Array.isArray(saved) || !saved.includes(previousSlug)) continue;

    const next = [
      ...new Set(
        saved
          .filter((item): item is string => typeof item === "string")
          .map((item) => (item === previousSlug ? nextSlug : item)),
      ),
    ];
    batch.set(doc.ref, { savedProperties: next }, { merge: true });
    updated += 1;
    ops += 1;

    if (ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  return updated;
}

/**
 * Compare live catalogue slugs to the last known list in Firestore.
 * Any slug that disappeared is purged from all user shortlists.
 */
export async function syncRemovedPropertiesFromCatalogue(): Promise<{
  removed: string[];
  purgedUsers: number;
}> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const db = getAdminFirestore();
    if (!db) {
      return { removed: [], purgedUsers: 0 };
    }

    let catalogue: Awaited<ReturnType<typeof listProperties>> = [];
    try {
      catalogue = await listProperties();
    } catch {
      return { removed: [], purgedUsers: 0 };
    }
    const currentSlugs = catalogue.map((property) => property.slug);
    const metaRef = db.doc(META_DOC);
    const metaSnap = await metaRef.get();
    const previousRaw = metaSnap.exists ? metaSnap.data()?.slugs : null;
    const previousSlugs = Array.isArray(previousRaw)
      ? previousRaw.filter((item): item is string => typeof item === "string")
      : [];

    // First run: record catalogue only — do not treat every listing as "removed".
    if (!metaSnap.exists || previousSlugs.length === 0) {
      await metaRef.set({
        slugs: currentSlugs,
        updatedAt: Date.now(),
      });
      return { removed: [], purgedUsers: 0 };
    }

    const removed = previousSlugs.filter((slug) => !currentSlugs.includes(slug));
    let purgedUsers = 0;
    for (const slug of removed) {
      purgedUsers += await purgePropertyFromAllUsers(slug);
    }

    await metaRef.set({
      slugs: currentSlugs,
      updatedAt: Date.now(),
    });

    return { removed, purgedUsers };
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}
