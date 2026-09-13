import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { isAdminEmail } from "@/lib/admin";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import { formatPhoneForStorage } from "@/lib/form-validation";
import type { PortalEnquiry, PortalSession } from "@/lib/portal";
import { filterOwnEnquiries, normalizePortalEnquiries } from "@/lib/portal";
import type { PropertyEnquiryRecord } from "@/lib/property-enquiry";

const FIRESTORE_TIMEOUT_MS = 10000;
const FIRESTORE_SETUP_ERROR =
  "Cloud Firestore is not set up (or blocked). In Firebase Console → Build → Firestore Database → Create database, then paste the rules from GO_LIVE.md.";

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Firestore rejects `undefined` field values. */
function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function enquiryForFirestore(enquiry: PortalEnquiry): Record<string, string | number> {
  return omitUndefined({
    id: enquiry.id,
    type: enquiry.type,
    summary: enquiry.summary,
    createdAt: enquiry.createdAt,
    ownerUserId: enquiry.ownerUserId,
    ownerEmail: enquiry.ownerEmail,
    status: enquiry.status,
    reply: enquiry.reply,
    repliedAt: enquiry.repliedAt,
    sourceEnquiryId: enquiry.sourceEnquiryId,
  });
}

function authErrorMessage(error: unknown, fallback: string): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: string }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    default:
      return fallback;
  }
}

async function fetchProfile(
  userId: string,
): Promise<{ name: string | null; phone: string | null }> {
  const db = getFirestoreDb();
  if (!db) return { name: null, phone: null };
  try {
    const snap = await withTimeout(
      getDoc(doc(db, "users", userId)),
      FIRESTORE_TIMEOUT_MS,
      FIRESTORE_SETUP_ERROR,
    );
    if (!snap.exists()) return { name: null, phone: null };
    const data = snap.data();
    const name =
      typeof data.name === "string" && data.name.trim() ? data.name.trim() : null;
    const phone =
      typeof data.phone === "string" && data.phone.trim()
        ? data.phone.trim()
        : null;
    return { name, phone };
  } catch (error) {
    if (error instanceof Error && error.message === FIRESTORE_SETUP_ERROR) {
      return { name: null, phone: null };
    }
    return { name: null, phone: null };
  }
}

async function toSession(user: User): Promise<PortalSession> {
  const profile = await fetchProfile(user.uid);
  const name = profile.name || user.displayName?.trim() || "Client";
  return {
    userId: user.uid,
    email: user.email ?? "",
    name,
    // Phone lives only in Firestore (not Firebase Auth email/password).
    phone: profile.phone || undefined,
  };
}

/** Refresh name/phone from Firestore onto an existing session. */
export async function firebaseEnrichSession(
  session: PortalSession,
): Promise<PortalSession> {
  const profile = await fetchProfile(session.userId);
  return {
    ...session,
    name: profile.name || session.name,
    phone: profile.phone || undefined,
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
    if (!user) {
      onChange(null);
      return;
    }
    void toSession(user)
      .then(onChange)
      .catch(() => {
        // Still prefer Firestore on retry via enrich; Auth has no phone field.
        onChange({
          userId: user.uid,
          email: user.email ?? "",
          name: user.displayName?.trim() || "Client",
          phone: undefined,
        });
      });
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
    return await toSession(result.user);
  } catch (error) {
    throw new Error(authErrorMessage(error, "Incorrect email or password."));
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

  if (isAdminEmail(input.email)) {
    throw new Error("This email is reserved for staff. Please log in instead.");
  }

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      input.email.trim().toLowerCase(),
      input.password,
    );
    const displayName = input.name.trim();
    const phone = formatPhoneForStorage(input.phone);
    const email = input.email.trim().toLowerCase();
    await updateProfile(result.user, { displayName });

    // Phone is not stored on Firebase Auth — persist it on the Firestore profile.
    try {
      await withTimeout(
        setDoc(
          doc(db, "users", result.user.uid),
          omitUndefined({
            name: displayName,
            email,
            phone,
            savedProperties: [],
            enquiries: [],
            createdAt: Date.now(),
          }),
        ),
        FIRESTORE_TIMEOUT_MS,
        FIRESTORE_SETUP_ERROR,
      );
    } catch (error) {
      if (error instanceof Error && error.message === FIRESTORE_SETUP_ERROR) {
        throw new Error(FIRESTORE_SETUP_ERROR);
      }
      throw new Error(
        "Account created, but your phone could not be saved. Check Firestore is set up, then try registering again or contact support.",
      );
    }

    await result.user.reload();
    const session = await toSession(result.user);
    return {
      ...session,
      name: displayName,
      phone,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === FIRESTORE_SETUP_ERROR ||
        error.message.includes("phone could not be saved"))
    ) {
      throw error;
    }
    throw new Error(
      authErrorMessage(error, "Unable to create account. Please try again."),
    );
  }
}

export async function firebaseGetIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function firebaseCreatePropertyEnquiry(
  enquiry: PropertyEnquiryRecord,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  try {
    await withTimeout(
      setDoc(
        doc(db, "propertyEnquiries", enquiry.id),
        omitUndefined({ ...enquiry }),
      ),
      FIRESTORE_TIMEOUT_MS,
      FIRESTORE_SETUP_ERROR,
    );
  } catch {
    // Server inbox is the source of truth; cloud copy is best-effort.
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
  try {
    const snap = await withTimeout(
      getDoc(doc(db, "users", userId)),
      FIRESTORE_TIMEOUT_MS,
      FIRESTORE_SETUP_ERROR,
    );
    if (!snap.exists()) return [];
    const data = snap.data();
    const saved = data.savedProperties;
    return Array.isArray(saved)
      ? saved.filter((s): s is string => typeof s === "string")
      : [];
  } catch (error) {
    if (error instanceof Error && error.message === FIRESTORE_SETUP_ERROR) {
      throw error;
    }
    return [];
  }
}

export async function firebaseToggleSave(
  userId: string,
  slug: string,
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Unable to save property right now. Please try again.");
  const ref = doc(db, "users", userId);

  let current: string[] = [];
  try {
    current = await firebaseGetSavedSlugs(userId);
  } catch (error) {
    if (error instanceof Error && error.message === FIRESTORE_SETUP_ERROR) {
      throw error;
    }
  }

  const exists = current.includes(slug);
  const savedProperties = exists
    ? current.filter((item) => item !== slug)
    : [...current, slug];

  try {
    await withTimeout(
      setDoc(
        ref,
        {
          savedProperties,
        },
        { merge: true },
      ),
      FIRESTORE_TIMEOUT_MS,
      FIRESTORE_SETUP_ERROR,
    );
  } catch (error) {
    if (error instanceof Error && error.message === FIRESTORE_SETUP_ERROR) {
      throw error;
    }
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "permission-denied") {
      throw new Error(
        "Firestore blocked this save. Update Firestore rules (see GO_LIVE.md) so users can write their own users/{userId} document.",
      );
    }
    throw new Error(
      "Could not update your shortlist. Check Firestore is created and your connection, then try again.",
    );
  }
  return !exists;
}

/** Replace the shortlist (used when pruning removed listings). */
export async function firebaseReplaceSavedSlugs(
  userId: string,
  savedProperties: string[],
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) return;
  try {
    await withTimeout(
      setDoc(doc(db, "users", userId), { savedProperties }, { merge: true }),
      FIRESTORE_TIMEOUT_MS,
      FIRESTORE_SETUP_ERROR,
    );
  } catch {
    // Non-blocking: UI already shows the pruned list.
  }
}

export async function firebaseGetEnquiries(
  userId: string,
): Promise<PortalEnquiry[]> {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();
  if (!db) return [];
  // Only the signed-in user may read their own enquiry history.
  if (!auth?.currentUser || auth.currentUser.uid !== userId) return [];
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return [];
    const data = snap.data();
    const email = String(data.email ?? auth.currentUser.email ?? "")
      .trim()
      .toLowerCase();
    return filterOwnEnquiries(
      userId,
      email,
      normalizePortalEnquiries(data.enquiries),
    );
  } catch {
    return [];
  }
}

export function firebaseWatchEnquiries(
  userId: string,
  onChange: (list: PortalEnquiry[]) => void,
): () => void {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();
  if (!db || !auth?.currentUser || auth.currentUser.uid !== userId) {
    return () => undefined;
  }

  return onSnapshot(
    doc(db, "users", userId),
    (snap) => {
      if (!snap.exists()) {
        onChange([]);
        return;
      }
      const data = snap.data();
      const email = String(data.email ?? auth.currentUser?.email ?? "")
        .trim()
        .toLowerCase();
      onChange(
        filterOwnEnquiries(
          userId,
          email,
          normalizePortalEnquiries(data.enquiries),
        ),
      );
    },
    () => {
      // Keep the last good list if a snapshot fails mid-update.
    },
  );
}

export async function firebaseAddEnquiry(
  userId: string,
  enquiry: Omit<PortalEnquiry, "id" | "createdAt">,
): Promise<PortalEnquiry[]> {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();
  if (!db) return [];
  if (!auth?.currentUser || auth.currentUser.uid !== userId) return [];
  const ownerEmail = (
    enquiry.ownerEmail ||
    auth.currentUser.email ||
    ""
  )
    .trim()
    .toLowerCase();
  const next: PortalEnquiry = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    type: enquiry.type,
    summary: enquiry.summary,
    ownerUserId: enquiry.ownerUserId || userId,
    status: enquiry.status ?? "open",
    ...(ownerEmail ? { ownerEmail } : {}),
    ...(enquiry.reply ? { reply: enquiry.reply } : {}),
    ...(enquiry.repliedAt != null ? { repliedAt: enquiry.repliedAt } : {}),
    ...(enquiry.sourceEnquiryId
      ? { sourceEnquiryId: enquiry.sourceEnquiryId }
      : {}),
  };
  const current = await firebaseGetEnquiries(userId);
  const enquiries = [next, ...current].slice(0, 20);
  try {
    await setDoc(
      doc(db, "users", userId),
      { enquiries: enquiries.map(enquiryForFirestore) },
      { merge: true },
    );
  } catch (error) {
    console.warn("[firebase] could not save enquiry to account", error);
    return [next, ...current].slice(0, 20);
  }
  return enquiries;
}
