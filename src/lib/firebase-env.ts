/** Server-side Firebase web API key (Identity Toolkit / Firestore REST). */

/**
 * Prefer `FIREBASE_API_KEY` (no HTTP-referrer restriction) for Node routes.
 * `NEXT_PUBLIC_FIREBASE_API_KEY` alone breaks admin inbox if that key is
 * limited to Websites — server calls have no browser Referer.
 */
export function serverFirebaseApiKey(): string {
  return (
    process.env.FIREBASE_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ||
    ""
  );
}

export function serverFirebaseProjectId(): string {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    ""
  );
}
