import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { PortalEnquiry, PortalSession } from "@/lib/portal";

function toSession(user: User): PortalSession {
  return {
    userId: user.uid,
    email: user.email ?? "",
    name: user.displayName || user.email?.split("@")[0] || "Client",
  };
}

export function firebaseAuthEnabled(): boolean {
  return isFirebaseConfigured();
}

export function watchFirebaseSession(
  onChange: (session: PortalSession | null) => void,
): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    onChange(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, (user) => {
    onChange(user ? toSession(user) : null);
  });
}

export async function firebaseLogin(
  email: string,
  password: string,
): Promise<PortalSession> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured.");

  try {
    const result = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );
    return toSession(result.user);
  } catch {
    throw new Error("Incorrect email or password.");
  }
}

export async function firebaseRegister(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<PortalSession> {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();
  if (!auth || !db) throw new Error("Firebase is not configured.");

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      input.email.trim().toLowerCase(),
      input.password,
    );
    await updateProfile(result.user, { displayName: input.name.trim() });
    await setDoc(doc(db, "users", result.user.uid), {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      savedProperties: [],
      enquiries: [],
      createdAt: Date.now(),
    });
    return toSession(result.user);
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "auth/email-already-in-use") {
      throw new Error("An account with this email already exists.");
    }
    throw new Error("Unable to create account. Please try again.");
  }
}

export async function firebaseLogout(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export async function firebaseGetSavedSlugs(userId: string): Promise<string[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return [];
  const data = snap.data();
  const saved = data.savedProperties;
  return Array.isArray(saved) ? saved.filter((s): s is string => typeof s === "string") : [];
}

export async function firebaseToggleSave(
  userId: string,
  slug: string,
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;
  const ref = doc(db, "users", userId);
  const current = await firebaseGetSavedSlugs(userId);
  const exists = current.includes(slug);
  await updateDoc(ref, {
    savedProperties: exists ? arrayRemove(slug) : arrayUnion(slug),
  });
  return !exists;
}

export async function firebaseGetEnquiries(
  userId: string,
): Promise<PortalEnquiry[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return [];
  const data = snap.data();
  const enquiries = data.enquiries;
  if (!Array.isArray(enquiries)) return [];
  return enquiries.filter(
    (item): item is PortalEnquiry =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "type" in item &&
      "summary" in item &&
      "createdAt" in item,
  );
}

export async function firebaseAddEnquiry(
  userId: string,
  enquiry: Omit<PortalEnquiry, "id" | "createdAt">,
): Promise<PortalEnquiry[]> {
  const db = getFirestoreDb();
  if (!db) return [];
  const next: PortalEnquiry = {
    ...enquiry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const current = await firebaseGetEnquiries(userId);
  const enquiries = [next, ...current].slice(0, 20);
  await setDoc(
    doc(db, "users", userId),
    { enquiries },
    { merge: true },
  );
  return enquiries;
}
