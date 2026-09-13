import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;
let db: Firestore | null = null;

function readServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    return JSON.parse(json) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
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

/** Server-only Admin Firestore. Returns null when credentials are not configured. */
export function getAdminFirestore(): Firestore | null {
  if (db) return db;

  const account = readServiceAccount();
  if (!account?.project_id || !account.client_email || !account.private_key) {
    return null;
  }

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

  db = getFirestore(app);
  return db;
}
