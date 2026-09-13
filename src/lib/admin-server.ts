import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPublicAdminEmail } from "@/lib/admin";
import { recordClientEnquiryStatusUpdate } from "@/lib/client-enquiry-updates";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  isPropertyEnquiryRecord,
  type PropertyEnquiryRecord,
} from "@/lib/property-enquiry";

const COLLECTION = "propertyEnquiries";
const FILE_PATH = path.join(process.cwd(), ".data", "property-enquiries.json");

type TokenCache = { token: string; expiresAt: number };
let staffToken: TokenCache | null = null;

export function getAdminEmail(): string {
  return (
    process.env.ADMIN_EMAIL?.trim().toLowerCase() || getPublicAdminEmail()
  );
}

export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password || null;
}

function firebaseApiKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "";
}

function getAdminDisplayName() {
  return process.env.ADMIN_NAME?.trim() || "MRA Admin";
}

function getAdminPhone() {
  return process.env.ADMIN_PHONE?.trim() || "";
}

function firebaseProjectId() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    ""
  );
}

export async function lookupFirebaseEmail(
  idToken: string,
): Promise<string | null> {
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
    users?: { email?: string }[];
  };
  const email = data.users?.[0]?.email;
  return email ? email.trim().toLowerCase() : null;
}

export async function requireAdminFromRequest(
  request: Request,
): Promise<{ ok: true; email: string } | { ok: false; status: number; error: string }> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    const demoEmail = request.headers.get("x-admin-email")?.trim().toLowerCase();
    if (!firebaseApiKey() && demoEmail === getAdminEmail()) {
      return { ok: true, email: demoEmail };
    }
    return { ok: false, status: 401, error: "Sign in as an admin to continue." };
  }

  const email = await lookupFirebaseEmail(token);
  if (!email || email !== getAdminEmail()) {
    return { ok: false, status: 403, error: "Admin access only." };
  }
  return { ok: true, email };
}

export async function seedAdminAccount(): Promise<{
  created: boolean;
  email: string;
  reason?: string;
}> {
  const email = getAdminEmail();
  const password = getAdminPassword();
  const apiKey = firebaseApiKey();

  if (!password) {
    return { created: false, email, reason: "ADMIN_PASSWORD is not set." };
  }
  if (!apiKey) {
    return { created: false, email, reason: "Firebase API key is not set." };
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
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
    localId?: string;
    error?: { message?: string };
  };

  let idToken = data.idToken;
  let userId = data.localId;
  let created = true;

  if (data.error?.message === "EMAIL_EXISTS") {
    const signedIn = await fetch(
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
    const existing = (await signedIn.json()) as {
      idToken?: string;
      localId?: string;
      error?: { message?: string };
    };
    if (!signedIn.ok || !existing.idToken) {
      return {
        created: false,
        email,
        reason:
          existing.error?.message ||
          "Admin email already exists with a different password.",
      };
    }
    idToken = existing.idToken;
    userId = existing.localId;
    created = false;
  } else if (!res.ok || !idToken) {
    return {
      created: false,
      email,
      reason: data.error?.message || "Could not create admin account.",
    };
  }

  const displayName = getAdminDisplayName();
  await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        displayName,
      }),
      signal: AbortSignal.timeout(15000),
    },
  ).catch(() => undefined);

  const projectId = firebaseProjectId();
  if (projectId && idToken && userId) {
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            name: { stringValue: displayName },
            email: { stringValue: email },
            phone: { stringValue: getAdminPhone() },
            role: { stringValue: "admin" },
            createdAt: { integerValue: String(Date.now()) },
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    ).catch(() => undefined);
  }

  return { created, email, reason: created ? undefined : "already-exists" };
}

async function staffIdToken(): Promise<string | null> {
  const apiKey = firebaseApiKey();
  const password = getAdminPassword();
  const email = getAdminEmail();
  if (!apiKey || !password) return null;

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

async function saveToAdminSdk(record: PropertyEnquiryRecord): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;
  const clean = Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
  await db.collection(COLLECTION).doc(record.id).set(clean);
  return true;
}

async function saveToFirestoreRest(record: PropertyEnquiryRecord): Promise<boolean> {
  const projectId = firebaseProjectId();
  if (!projectId) return false;
  const token = await staffIdToken();

  const post = async (withAuth: boolean) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (withAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}?documentId=${encodeURIComponent(record.id)}&key=${encodeURIComponent(firebaseApiKey())}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(toFirestoreDocument(record)),
        signal: AbortSignal.timeout(15000),
      },
    );
  };

  let res = token ? await post(true) : await post(false);
  if (!res.ok && token && (res.status === 401 || res.status === 403)) {
    res = await post(false);
  }
  if (!res.ok) {
    const body = await res.text();
    console.warn("[admin] firestore rest write failed", res.status, body);
    return false;
  }
  return true;
}

async function listFromAdminSdk(): Promise<PropertyEnquiryRecord[]> {
  const db = getAdminFirestore();
  if (!db) return [];
  const snap = await db.collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs
    .map((doc) => doc.data())
    .filter(isPropertyEnquiryRecord);
}

async function listFromFirestoreRest(): Promise<PropertyEnquiryRecord[]> {
  const projectId = firebaseProjectId();
  const token = await staffIdToken();
  if (!projectId || !token) return [];

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}?key=${encodeURIComponent(firebaseApiKey())}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    documents?: { name?: string; fields?: Record<string, { stringValue?: string; integerValue?: string; booleanValue?: boolean }> }[];
  };
  return (data.documents || [])
    .map(fromFirestoreDocument)
    .filter((item): item is PropertyEnquiryRecord => Boolean(item));
}

function mergeRecords(groups: PropertyEnquiryRecord[][]) {
  const map = new Map<string, PropertyEnquiryRecord>();
  for (const group of groups) {
    for (const item of group) {
      map.set(item.id, item);
    }
  }
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function savePropertyEnquiry(
  record: PropertyEnquiryRecord,
): Promise<void> {
  const current = await readFileStore();
  await writeFileStore([record, ...current.filter((item) => item.id !== record.id)]);

  try {
    const viaSdk = await saveToAdminSdk(record);
    if (!viaSdk) await saveToFirestoreRest(record);
  } catch (error) {
    console.warn("[admin] cloud inbox write skipped", error);
  }
}

export async function listPropertyEnquiries(): Promise<PropertyEnquiryRecord[]> {
  const file = await readFileStore();
  let cloud: PropertyEnquiryRecord[] = [];
  try {
    cloud = await listFromAdminSdk();
    if (cloud.length === 0) cloud = await listFromFirestoreRest();
  } catch (error) {
    console.warn("[admin] cloud inbox read skipped", error);
  }
  return mergeRecords([file, cloud]);
}

export async function markPropertyEnquiryRead(
  id: string,
  read: boolean,
): Promise<PropertyEnquiryRecord | null> {
  const records = await listPropertyEnquiries();
  const current = records.find((item) => item.id === id);
  if (!current) return null;
  const next = { ...current, read };
  await savePropertyEnquiry(next);
  return next;
}

async function sendReplyEmail(input: {
  to: string;
  name: string;
  reply: string;
  propertyTitle: string;
  originalMessage: string;
}) {
  const user = process.env.CONTACT_SMTP_USER?.trim();
  const pass = process.env.CONTACT_SMTP_PASS?.trim();
  if (!user || !pass) {
    throw new Error("Email is not configured (CONTACT_SMTP_USER / CONTACT_SMTP_PASS).");
  }

  const nodemailer = await import("nodemailer");
  const host = process.env.CONTACT_SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.CONTACT_SMTP_PORT || "465");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"MRA Haven Estates" <${user}>`,
    to: input.to,
    subject: `Re: your enquiry about ${input.propertyTitle}`,
    text: [
      `Hello ${input.name},`,
      "",
      input.reply,
      "",
      "—",
      "MRA Haven Estates",
      "",
      "Your original message:",
      input.originalMessage,
    ].join("\n"),
  });
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
}): Promise<PropertyEnquiryRecord> {
  const reply = input.reply.trim();
  if (!reply) {
    throw new Error("Please enter a reply.");
  }

  const records = await listPropertyEnquiries();
  const current = records.find((item) => item.id === input.id);
  if (!current) {
    throw new Error("Enquiry not found.");
  }

  const repliedAt = Date.now();
  await sendReplyEmail({
    to: current.email,
    name: current.name,
    reply,
    propertyTitle: current.property.title,
    originalMessage: current.message,
  });

  const next: PropertyEnquiryRecord = {
    ...current,
    read: true,
    status: "answered",
    reply,
    repliedAt,
    repliedBy: input.repliedBy,
  };
  await savePropertyEnquiry(next);

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

async function deleteFromFirestoreRest(id: string): Promise<boolean> {
  const projectId = firebaseProjectId();
  const token = await staffIdToken();
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
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const records = await listPropertyEnquiries();
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

  const remaining = records.filter((item) => item.id !== input.id);
  await writeFileStore(remaining);

  try {
    const viaSdk = await deleteFromAdminSdk(input.id);
    if (!viaSdk) await deleteFromFirestoreRest(input.id);
  } catch (error) {
    console.warn("[admin] cloud inbox delete skipped", error);
  }

  return { ok: true };
}

export function newPropertyEnquiryId() {
  return crypto.randomUUID();
}
