import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from "firebase/firestore";

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

/** Public web app config for mra-haven-estates-2e26e. Safe to ship in the client. */
const PROJECT_CONFIG: FirebasePublicConfig = {
  apiKey: "AIzaSyC1h2j7CCKJ49omnK5oeQsRJ8Nikp-UTdc",
  authDomain: "mra-haven-estates-2e26e.firebaseapp.com",
  projectId: "mra-haven-estates-2e26e",
  storageBucket: "mra-haven-estates-2e26e.firebasestorage.app",
  messagingSenderId: "112003430709",
  appId: "1:112003430709:web:9d103d9fd1ec3175f8747c",
};

function readConfig(): FirebasePublicConfig {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();

  if (apiKey && authDomain && projectId && appId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket: storageBucket || PROJECT_CONFIG.storageBucket,
      messagingSenderId: messagingSenderId || PROJECT_CONFIG.messagingSenderId,
      appId,
    };
  }

  return PROJECT_CONFIG;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(readConfig().apiKey && readConfig().projectId);
}

export function getFirebaseApp(): FirebaseApp | null {
  const config = readConfig();
  if (!config) return null;
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(config);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!auth) auth = getAuth(firebaseApp);
  return auth;
}

export function getFirestoreDb(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!db) {
    try {
      // Memory cache avoids “stuck offline” hangs when Firestore isn’t set up yet.
      db = initializeFirestore(firebaseApp, {
        localCache: memoryLocalCache(),
      });
    } catch {
      db = getFirestore(firebaseApp);
    }
  }
  return db;
}
