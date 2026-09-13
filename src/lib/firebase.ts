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

/** Public web app config for mra-haven-estates-7a175. Safe to ship in the client. */
const PROJECT_CONFIG: FirebasePublicConfig = {
  apiKey: "AIzaSyDboKVyms5DbYarOVbj_V8_AIImCPupLTU",
  authDomain: "mra-haven-estates-7a175.firebaseapp.com",
  projectId: "mra-haven-estates-7a175",
  storageBucket: "mra-haven-estates-7a175.firebasestorage.app",
  messagingSenderId: "320984899387",
  appId: "1:320984899387:web:3df31e699071c5bf9e611e",
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
