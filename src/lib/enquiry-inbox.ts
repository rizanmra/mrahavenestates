import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  isPropertyEnquiryRecord,
  type PropertyEnquiryRecord,
} from "@/lib/property-enquiry";

/**
 * Lightweight inbox writer for public /api/enquiry.
 * Intentionally avoids firebase-admin — that SDK was crashing Vercel route boots.
 *
 * Persistence: Firestore REST create (rules allow unauthenticated create).
 * Local memory/file are best-effort only and do not survive across Vercel instances.
 */

const COLLECTION = "propertyEnquiries";
const FILE_PATH = path.join(
  process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".data"),
  "property-enquiries.json",
);

let memoryInbox: PropertyEnquiryRecord[] = [];
type TokenCache = { token: string; expiresAt: number };
let staffToken: TokenCache | null = null;

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

export function newEnquiryId() {
  return randomUUID();
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

function toFirestoreDocument(record: PropertyEnquiryRecord) {
  return {
    fields: {
      id: { stringValue: record.id },
      name: { stringValue: record.name },
      email: { stringValue: record.email },
      phone: { stringValue: record.phone },
      message: { stringValue: record.message },
      createdAt: { integerValue: String(record.createdAt) },
      read: { booleanValue: record.read },
      status: { stringValue: record.status || "open" },
      payload: { stringValue: JSON.stringify(record) },
    },
  };
}

async function staffIdToken(): Promise<string | null> {
  const apiKey = firebaseApiKey();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const email = await readAssignedAdminEmail();
  if (!apiKey || !password || !email) return null;

  if (staffToken && Date.now() < staffToken.expiresAt - 60_000) {
    return staffToken.token;
  }

  try {
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
    };
    if (!res.ok || !data.idToken) return null;
    staffToken = {
      token: data.idToken,
      expiresAt: Date.now() + Number(data.expiresIn || "3600") * 1000,
    };
    return data.idToken;
  } catch {
    return null;
  }
}

/**
 * Public rules allow create only — never PATCH first without auth.
 * Create with POST (+ API key). If the doc already exists, PATCH with staff token.
 */
async function saveToFirestoreRest(record: PropertyEnquiryRecord): Promise<boolean> {
  const projectId = firebaseProjectId();
  const apiKey = firebaseApiKey();
  if (!projectId || !apiKey) return false;

  const key = encodeURIComponent(apiKey);
  const createPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}?documentId=${encodeURIComponent(record.id)}&key=${key}`;
  const patchPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(record.id)}?key=${key}`;
  const body = JSON.stringify(toFirestoreDocument(record));

  const send = async (
    url: string,
    method: "POST" | "PATCH",
    token: string | null,
  ) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(12000),
    });
  };

  try {
    // Unauthenticated create — matches `allow create: if true`
    let res = await send(createPath, "POST", null);
    if (res.ok) return true;

    const createStatus = res.status;
    const createText = await res.text();

    // Already exists (or create denied) — try authenticated update
    const token = await staffIdToken();
    if (token) {
      res = await send(patchPath, "PATCH", token);
      if (res.ok) return true;
      res = await send(createPath, "POST", token);
      if (res.ok) return true;
      console.warn(
        "[enquiry-inbox] firestore rest",
        res.status,
        await res.text(),
      );
      return false;
    }

    console.warn(
      "[enquiry-inbox] firestore rest create failed",
      createStatus,
      createText,
    );
    return false;
  } catch (error) {
    console.warn("[enquiry-inbox] firestore rest skipped", error);
    return false;
  }
}

/** Persist an enquiry for the staff inbox. Throws if cloud write fails. */
export async function savePublicEnquiry(
  record: PropertyEnquiryRecord,
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
    console.warn("[enquiry-inbox] local write skipped", error);
  }

  const cloudOk = await saveToFirestoreRest(record);
  if (!cloudOk) {
    // Best-effort sync through the full admin writer when Admin SDK is healthy.
    try {
      const admin = await import("@/lib/admin-server");
      await admin.savePropertyEnquiry(record);
      return;
    } catch (error) {
      console.warn("[enquiry-inbox] admin-server sync skipped", error);
    }
    throw new Error(
      "Could not save your enquiry to the staff inbox. Please try again.",
    );
  }

  try {
    const admin = await import("@/lib/admin-server");
    await admin.savePropertyEnquiry(record);
  } catch (error) {
    console.warn("[enquiry-inbox] admin-server sync skipped", error);
  }
}

/** Best-effort staff email from Firestore config (REST only). */
export async function readAssignedAdminEmail(): Promise<string | null> {
  const projectId = firebaseProjectId();
  const apiKey = firebaseApiKey();
  if (!projectId || !apiKey) return null;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/config/admin?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      fields?: { email?: { stringValue?: string } };
    };
    return data.fields?.email?.stringValue?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}
