import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;
let db: Firestore | null = null;

function readServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    try {
      return JSON.parse(json) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
    } catch {
      return null;
    }
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  return null;
}

function ensureAdminApp(): App | null {
  if (app) return app;

  const account = readServiceAccount();
  if (!account?.project_id || !account.client_email || !account.private_key) {
    return null;
  }

  try {
    if (!getApps().length) {
      app = initializeApp({
        credential: cert({
          projectId: account.project_id,
          clientEmail: account.client_email,
          privateKey: account.private_key,
        }),
        projectId: account.project_id,
      });
    } else {
      app = getApps()[0]!;
    }
    return app;
  } catch {
    return null;
  }
}

/** Server-only Admin Firestore. Returns null when credentials are not configured. */
export function getAdminFirestore(): Firestore | null {
  if (db) return db;
  const firebaseApp = ensureAdminApp();
  if (!firebaseApp) return null;
  db = getFirestore(firebaseApp);
  return db;
}

/** Server-only Admin Auth. Used to update the staff password in Firebase. */
export function getAdminAuth(): Auth | null {
  const firebaseApp = ensureAdminApp();
  if (!firebaseApp) return null;
  return getAuth(firebaseApp);
}
