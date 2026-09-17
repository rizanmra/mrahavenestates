import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  readStaffSessionCookie,
  verifyStaffSessionToken,
} from "@/lib/admin-session";
import { recordClientEnquiryStatusUpdate } from "@/lib/client-enquiry-updates";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { isReservedStaffEmail } from "@/lib/admin";
import {
  isPropertyEnquiryRecord,
  type PropertyEnquiryRecord,
} from "@/lib/property-enquiry";

const COLLECTION = "propertyEnquiries";
const FILE_PATH = path.join(
  process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".data"),
  "property-enquiries.json",
);
let memoryInbox: PropertyEnquiryRecord[] = [];

type TokenCache = { token: string; expiresAt: number };
let staffToken: TokenCache | null = null;

export type AssignedAdmin = {
  userId: string;
  email: string;
};

function firebaseApiKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "";
}

function firebaseProjectId() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    ""
  );
}

export async function lookupFirebaseUser(
  idToken: string,
): Promise<{ email: string; userId: string } | null> {
  const apiKey = firebaseApiKey();
  if (!apiKey || !idToken) return null;

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    users?: { email?: string; localId?: string }[];
  };
  const email = data.users?.[0]?.email?.trim().toLowerCase();
  const userId = data.users?.[0]?.localId?.trim();
  if (!email || !userId) return null;
  return { email, userId };
}

export async function lookupFirebaseEmail(
  idToken: string,
): Promise<string | null> {
  const user = await lookupFirebaseUser(idToken);
  return user?.email ?? null;
}

function matchesAdmin(
  admin: AssignedAdmin,
  user: { email?: string; userId?: string },
) {
  if (user.userId && admin.userId === user.userId) return true;
  return Boolean(user.email && admin.email === user.email);
}

async function readAssignedAdminFromSdk(): Promise<AssignedAdmin | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  const snap = await db.doc("config/admin").get();
  if (!snap.exists) return null;
  const data = snap.data() as { userId?: string; email?: string } | undefined;
  const userId = data?.userId?.trim();
  const email = data?.email?.trim().toLowerCase();
  if (!userId || !email) return null;
  return { userId, email };
}

async function readAssignedAdminFromRest(
  idToken?: string,
): Promise<AssignedAdmin | null> {
  const projectId = firebaseProjectId();
  const apiKey = firebaseApiKey();
  if (!projectId || !apiKey) return null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/admin?key=${encodeURIComponent(apiKey)}`,
    { headers, signal: AbortSignal.timeout(15000) },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    fields?: { userId?: { stringValue?: string }; email?: { stringValue?: string } };
  };
  const userId = data.fields?.userId?.stringValue?.trim();
  const email = data.fields?.email?.stringValue?.trim().toLowerCase();
  if (!userId || !email) return null;
  return { userId, email };
}

let memoryAdmin: AssignedAdmin | null = null;

export async function getAssignedAdmin(
  idToken?: string,
): Promise<AssignedAdmin | null> {
  if (memoryAdmin) return memoryAdmin;
  try {
    const fromSdk = await readAssignedAdminFromSdk();
    if (fromSdk) {
      memoryAdmin = fromSdk;
      return fromSdk;
    }
  } catch {
    // Fall through to REST.
  }
  try {
    const fromRest = await readAssignedAdminFromRest(idToken);
    if (fromRest) memoryAdmin = fromRest;
    return fromRest;
  } catch {
    return null;
  }
}

/** Reserved staff email or match against existing config/admin (no auto-claim). */
export async function resolveAdminAccess(
  user: AssignedAdmin,
  idToken?: string,
): Promise<{ isAdmin: boolean; admin: AssignedAdmin | null }> {
  if (isReservedStaffEmail(user.email)) {
    const admin = await getAssignedAdmin(idToken);
    return { isAdmin: true, admin: admin ?? user };
  }
  const admin = await getAssignedAdmin(idToken);
  if (!admin) return { isAdmin: false, admin: null };
  return {
    isAdmin: matchesAdmin(admin, user),
    admin,
  };
}

export async function requireAdminFromRequest(
  request: Request,
): Promise<
  | { ok: true; email: string; idToken?: string }
  | { ok: false; status: number; error: string }
> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  // Firebase ID token is the source of truth on Vercel (no shared /tmp, no Admin SDK).
  if (token) {
    const user = await lookupFirebaseUser(token);
    if (user) {
      if (isReservedStaffEmail(user.email)) {
        return { ok: true, email: user.email, idToken: token };
      }
      const access = await resolveAdminAccess(user, token);
      if (access.isAdmin) {
        return { ok: true, email: user.email, idToken: token };
      }
      return { ok: false, status: 403, error: "Admin access only." };
    }
  }

  const cookieEmail = verifyStaffSessionToken(
    readStaffSessionCookie(request) || "",
  );
  if (cookieEmail && isReservedStaffEmail(cookieEmail)) {
    return { ok: true, email: cookieEmail, idToken: token || undefined };
  }

  const assigned = await getAssignedAdmin(token || undefined);
  if (
    cookieEmail &&
    assigned &&
    cookieEmail === assigned.email
  ) {
    return { ok: true, email: cookieEmail, idToken: token || undefined };
  }

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "Sign in as an admin to continue.",
    };
  }

  return {
    ok: false,
    status: 401,
    error: "Sign in as an admin to continue.",
  };
}

async function staffIdToken(): Promise<string | null> {
  const apiKey = firebaseApiKey();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const assigned = await getAssignedAdmin();
  const email =
    assigned?.email ||
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ||
    "mrahavenestates@gmail.com";
  if (!apiKey || !password || !email) return null;

  if (staffToken && Date.now() < staffToken.expiresAt - 60_000) {
    return staffToken.token;
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  const data = (await res.json()) as {
    idToken?: string;
    expiresIn?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.idToken) {
    console.warn("[admin] staff sign-in failed", data.error?.message);
    return null;
  }

  const expiresInMs = Number(data.expiresIn || "3600") * 1000;
  staffToken = {
    token: data.idToken,
    expiresAt: Date.now() + expiresInMs,
  };
  return data.idToken;
}

async function readFileStore(): Promise<PropertyEnquiryRecord[]> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPropertyEnquiryRecord);
  } catch {
    return [];
  }
}

async function writeFileStore(records: PropertyEnquiryRecord[]) {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(records, null, 2), "utf8");
}

function firestoreString(value: string) {
  return { stringValue: value };
}

function toFirestoreDocument(record: PropertyEnquiryRecord) {
  return {
    fields: {
      id: firestoreString(record.id),
      name: firestoreString(record.name),
      email: firestoreString(record.email),
      phone: firestoreString(record.phone),
      message: firestoreString(record.message),
      createdAt: { integerValue: String(record.createdAt) },
      read: { booleanValue: record.read },
      status: firestoreString(record.status || "open"),
      payload: firestoreString(JSON.stringify(record)),
    },
  };
}

function fromFirestoreDocument(doc: {
  name?: string;
  fields?: Record<string, { stringValue?: string; integerValue?: string; booleanValue?: boolean }>;
}): PropertyEnquiryRecord | null {
  const payload = doc.fields?.payload?.stringValue;
  if (payload) {
    try {
      const parsed = JSON.parse(payload) as unknown;
      if (isPropertyEnquiryRecord(parsed)) return parsed;
    } catch {
      // fall through
    }
  }

  const fields = doc.fields;
  if (!fields?.id?.stringValue || !fields.name?.stringValue) return null;
  const fallback: PropertyEnquiryRecord = {
    id: fields.id.stringValue,
    name: fields.name.stringValue,
    email: fields.email?.stringValue || "",
    phone: fields.phone?.stringValue || "",
    message: fields.message?.stringValue || "",
    createdAt: Number(fields.createdAt?.integerValue || Date.now()),
    read: Boolean(fields.read?.booleanValue),
    status:
      fields.status?.stringValue === "answered" ? "answered" : "open",
    property: {
      slug: "",
      title: "",
      location: "",
      price: "",
      status: "",
      type: "",
      beds: 0,
      baths: 0,
      area: "",
    },
  };
  return isPropertyEnquiryRecord(fallback) ? fallback : null;
}

function recordFromCloudData(
  data: Record<string, unknown>,
): PropertyEnquiryRecord | null {
  if (isPropertyEnquiryRecord(data)) return data;
  if (typeof data.payload === "string") {
    try {
      const parsed = JSON.parse(data.payload) as unknown;
      if (isPropertyEnquiryRecord(parsed)) return parsed;
    } catch {
      // fall through
    }
  }
  return null;
}

async function resolveFirestoreToken(
  idToken?: string | null,
): Promise<string | null> {
  if (idToken?.trim()) return idToken.trim();
  return staffIdToken();
}

async function saveToAdminSdk(record: PropertyEnquiryRecord): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  const clean = Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
  await db.collection(COLLECTION).doc(record.id).set(clean);
  return true;
}

async function saveToFirestoreRest(
  record: PropertyEnquiryRecord,
  idToken?: string | null,
): Promise<boolean> {
  const projectId = firebaseProjectId();
  const apiKey = firebaseApiKey();
  if (!projectId || !apiKey) return false;
  const token = await resolveFirestoreToken(idToken);
  const key = encodeURIComponent(apiKey);
  const docPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(record.id)}?key=${key}`;
  const createPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}?documentId=${encodeURIComponent(record.id)}&key=${key}`;
  const body = JSON.stringify(toFirestoreDocument(record));

  const send = async (
    url: string,
    method: "PATCH" | "POST",
    authToken: string | null,
  ) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    return fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    });
  };

  // Public create first (rules: allow create if true). Auth only needed for updates.
  let res = await send(createPath, "POST", null);
  if (res.ok) return true;

  if (token) {
    res = await send(docPath, "PATCH", token);
    if (res.ok) return true;
    res = await send(createPath, "POST", token);
    if (res.ok) return true;
  }

  const text = await res.text();
  console.warn("[admin] firestore rest write failed", res.status, text);
  return false;
}

async function listFromAdminSdk(): Promise<PropertyEnquiryRecord[]> {
  const db = getAdminFirestore();
  if (!db) return [];
  const snap = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs
    .map((doc) => recordFromCloudData(doc.data() as Record<string, unknown>))
    .filter((item): item is PropertyEnquiryRecord => Boolean(item));
}

async function listFromFirestoreRest(
  idToken?: string | null,
  emailFilter?: string | null,
): Promise<PropertyEnquiryRecord[]> {
  const projectId = firebaseProjectId();
  const token = await resolveFirestoreToken(idToken);
  if (!projectId || !token) return [];

  const key = encodeURIComponent(firebaseApiKey());
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    if (emailFilter?.trim()) {
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${key}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            // Equality-only query — sort by createdAt in mergeRecords so we
            // don't require a composite Firestore index (email + createdAt).
            structuredQuery: {
              from: [{ collectionId: COLLECTION }],
              where: {
                fieldFilter: {
                  field: { fieldPath: "email" },
                  op: "EQUAL",
                  value: { stringValue: emailFilter.trim().toLowerCase() },
                },
              },
              limit: 100,
            },
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!res.ok) {
        console.warn(
          "[admin] firestore rest query failed",
          res.status,
          await res.text(),
        );
        return [];
      }
      const rows = (await res.json()) as Array<{
        document?: {
          name?: string;
          fields?: Record<
            string,
            {
              stringValue?: string;
              integerValue?: string;
              booleanValue?: boolean;
            }
          >;
        };
      }>;
      return rows
        .map((row) => (row.document ? fromFirestoreDocument(row.document) : null))
        .filter((item): item is PropertyEnquiryRecord => Boolean(item));
    }

    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}?key=${key}&pageSize=300`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!res.ok) {
      console.warn(
        "[admin] firestore rest list failed",
        res.status,
        await res.text(),
      );
      return [];
    }
    const data = (await res.json()) as {
      documents?: {
        name?: string;
        fields?: Record<
          string,
          {
            stringValue?: string;
            integerValue?: string;
            booleanValue?: boolean;
          }
        >;
      }[];
    };
    return (data.documents || [])
      .map(fromFirestoreDocument)
      .filter((item): item is PropertyEnquiryRecord => Boolean(item));
  } catch (error) {
    console.warn("[admin] firestore rest list skipped", error);
    return [];
  }
}

function enquiryRank(item: PropertyEnquiryRecord) {
  return (
    (item.repliedAt ?? 0) +
    (item.reply ? 1 : 0) +
    (item.status === "answered" ? 1 : 0)
  );
}

function mergeRecords(groups: PropertyEnquiryRecord[][]) {
  const map = new Map<string, PropertyEnquiryRecord>();
  for (const group of groups) {
    for (const item of group) {
      const existing = map.get(item.id);
      if (!existing || enquiryRank(item) >= enquiryRank(existing)) {
        map.set(item.id, existing ? { ...existing, ...item } : item);
      }
    }
  }
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function listInboxRowsForEmail(
  email: string,
  idToken?: string | null,
): Promise<PropertyEnquiryRecord[]> {
  const needle = email.trim().toLowerCase();
  if (!needle) return [];
  const file = await readFileStore();
  let cloud: PropertyEnquiryRecord[] = [];
  try {
    const viaSdk = await listFromAdminSdk();
    const viaRest = await listFromFirestoreRest(idToken, needle);
    cloud = mergeRecords([viaSdk, viaRest]);
  } catch (error) {
    console.warn("[admin] client inbox read skipped", error);
  }
  return mergeRecords([memoryInbox, file, cloud]).filter(
    (item) => item.email.trim().toLowerCase() === needle,
  );
}

export async function listInboxStatusUpdatesForEmail(
  email: string,
  idToken?: string | null,
) {
  const rows = await listInboxRowsForEmail(email, idToken);
  return rows
    .filter((item) => item.reply || item.status === "answered")
    .map((item) => ({
      sourceEnquiryId: item.id,
      status: "answered" as const,
      reply: item.reply || "",
      repliedAt: item.repliedAt || item.createdAt,
    }));
}

export async function savePropertyEnquiry(
  record: PropertyEnquiryRecord,
  options?: { idToken?: string | null },
): Promise<void> {
  memoryInbox = [
    record,
    ...memoryInbox.filter((item) => item.id !== record.id),
  ];

  try {
    const current = await readFileStore();
    await writeFileStore([
      record,
      ...current.filter((item) => item.id !== record.id),
    ]);
  } catch (error) {
    console.warn("[admin] local inbox write skipped", error);
  }

  try {
    const viaSdk = await saveToAdminSdk(record);
    if (!viaSdk) await saveToFirestoreRest(record, options?.idToken);
  } catch (error) {
    console.warn("[admin] cloud inbox write skipped", error);
  }
}

export async function listPropertyEnquiries(options?: {
  idToken?: string | null;
}): Promise<PropertyEnquiryRecord[]> {
  const file = await readFileStore();
  let cloud: PropertyEnquiryRecord[] = [];
  try {
    cloud = await listFromAdminSdk();
    const viaRest = await listFromFirestoreRest(options?.idToken);
    cloud = mergeRecords([cloud, viaRest]);
  } catch (error) {
    console.warn("[admin] cloud inbox read skipped", error);
  }
  return mergeRecords([memoryInbox, file, cloud]);
}

export async function markPropertyEnquiryRead(
  id: string,
  read: boolean,
  options?: { idToken?: string | null },
): Promise<PropertyEnquiryRecord | null> {
  const records = await listPropertyEnquiries(options);
  const current = records.find((item) => item.id === id);
  if (!current) return null;
  const next = { ...current, read };
  await savePropertyEnquiry(next, options);
  return next;
}

async function markClientEnquiryStatus(input: {
  email: string;
  sourceEnquiryId: string;
  status: "answered" | "closed";
  reply: string;
  repliedAt: number;
}) {
  await recordClientEnquiryStatusUpdate({
    email: input.email,
    sourceEnquiryId: input.sourceEnquiryId,
    status: input.status,
    reply: input.reply,
    repliedAt: input.repliedAt,
  });

  const db = getAdminFirestore();
  if (!db) return;

  const snap = await db.collection("users").get();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (
      String(data.email ?? "")
        .trim()
        .toLowerCase() !== input.email
    ) {
      continue;
    }
    const enquiries = Array.isArray(data.enquiries) ? data.enquiries : [];
    let changed = false;
    const next = enquiries.map((item: Record<string, unknown>) => {
      if (
        item &&
        typeof item === "object" &&
        item.sourceEnquiryId === input.sourceEnquiryId
      ) {
        changed = true;
        return {
          ...item,
          status: input.status,
          reply: input.reply,
          repliedAt: input.repliedAt,
        };
      }
      return item;
    });

    if (changed) {
      await doc.ref.set({ enquiries: next }, { merge: true });
    }
  }
}

export async function replyToPropertyEnquiry(input: {
  id: string;
  reply: string;
  repliedBy: string;
  idToken?: string | null;
}): Promise<PropertyEnquiryRecord> {
  const reply = input.reply.trim();
  if (!reply) {
    throw new Error("Please enter a reply.");
  }

  const options = { idToken: input.idToken };
  const records = await listPropertyEnquiries(options);
  const current = records.find((item) => item.id === input.id);
  if (!current) {
    throw new Error("Enquiry not found.");
  }

  const repliedAt = Date.now();
  const next: PropertyEnquiryRecord = {
    ...current,
    read: true,
    status: "answered",
    reply,
    repliedAt,
    repliedBy: input.repliedBy,
  };
  await savePropertyEnquiry(next, options);

  try {
    await markClientEnquiryStatus({
      email: current.email.trim().toLowerCase(),
      sourceEnquiryId: current.id,
      status: "answered",
      reply,
      repliedAt,
    });
  } catch (error) {
    console.warn("[admin] client enquiry status update skipped", error);
  }

  return next;
}

async function deleteFromAdminSdk(id: string): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  await db.collection(COLLECTION).doc(id).delete();
  return true;
}

async function deleteFromFirestoreRest(
  id: string,
  idToken?: string | null,
): Promise<boolean> {
  const projectId = firebaseProjectId();
  const token = await resolveFirestoreToken(idToken);
  if (!projectId || !token) return false;

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(id)}?key=${encodeURIComponent(firebaseApiKey())}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  return res.ok || res.status === 404;
}

/** Remove from staff inbox; mark the client's copy as closed/finished. */
export async function deletePropertyEnquiry(input: {
  id: string;
  closedBy: string;
  idToken?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const options = { idToken: input.idToken };
  const records = await listPropertyEnquiries(options);
  const current = records.find((item) => item.id === input.id);
  if (!current) {
    return { ok: false, error: "Enquiry not found." };
  }

  const repliedAt = Date.now();
  const reply =
    current.reply?.trim() ||
    "Your enquiry has been closed by our team. If you still need help, please contact us again.";

  try {
    await markClientEnquiryStatus({
      email: current.email.trim().toLowerCase(),
      sourceEnquiryId: current.id,
      status: "closed",
      reply,
      repliedAt,
    });
  } catch (error) {
    console.warn("[admin] client enquiry close skipped", error);
  }

  memoryInbox = memoryInbox.filter((item) => item.id !== input.id);
  const remaining = records.filter((item) => item.id !== input.id);
  try {
    await writeFileStore(remaining);
  } catch (error) {
    console.warn("[admin] local inbox delete skipped", error);
  }

  try {
    const viaSdk = await deleteFromAdminSdk(input.id);
    if (!viaSdk) await deleteFromFirestoreRest(input.id, input.idToken);
  } catch (error) {
    console.warn("[admin] cloud inbox delete skipped", error);
  }

  return { ok: true };
}

export function newPropertyEnquiryId() {
  return crypto.randomUUID();
}
