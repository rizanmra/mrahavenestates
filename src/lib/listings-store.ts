import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  seedProperties,
  sortPropertiesNewestFirst,
  slugifyTitle,
  type Property,
  type PropertyStatus,
  type PropertyType,
} from "@/data/properties";
import { getAdminFirestore } from "@/lib/firebase-admin";

const COLLECTION = "properties";
const FILE_PATH = path.join(
  process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".data"),
  "listings.json",
);

let cache: Property[] | null = null;
let seedInFlight: Promise<void> | null = null;

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

function isProperty(value: unknown): value is Property {
  if (!value || typeof value !== "object") return false;
  const item = value as Property;
  return (
    typeof item.slug === "string" &&
    typeof item.title === "string" &&
    typeof item.location === "string" &&
    typeof item.price === "string" &&
    typeof item.beds === "number" &&
    typeof item.baths === "number" &&
    typeof item.area === "string" &&
    (item.type === "sale" || item.type === "rent") &&
    typeof item.status === "string" &&
    typeof item.summary === "string" &&
    typeof item.image === "string"
  );
}

function normalize(list: Property[]): Property[] {
  return sortPropertiesNewestFirst(
    list.map((item) => ({
      ...item,
      createdAt: item.createdAt || Date.now(),
    })),
  );
}

function propertyFromFields(
  fields: Record<string, { stringValue?: string; integerValue?: string }> | undefined,
  fallbackSlug: string,
): Property | null {
  if (!fields) return null;
  const str = (key: string) => fields[key]?.stringValue?.trim() || "";
  const num = (key: string) => Number(fields[key]?.integerValue || fields[key]?.stringValue || 0);
  const type = str("type");
  const status = str("status");
  const title = str("title");
  const slug = str("slug") || fallbackSlug;
  if (!title || !slug) return null;
  if (type !== "sale" && type !== "rent") return null;
  return {
    slug,
    title,
    location: str("location"),
    price: str("price"),
    beds: num("beds"),
    baths: num("baths") || 1,
    area: str("area"),
    type,
    status: (status as PropertyStatus) || (type === "sale" ? "For Sale" : "For Rent"),
    summary: str("summary"),
    image: str("image"),
    createdAt: num("createdAt") || Date.now(),
  };
}

function toFirestoreFields(property: Property) {
  return {
    fields: {
      slug: { stringValue: property.slug },
      title: { stringValue: property.title },
      location: { stringValue: property.location },
      price: { stringValue: property.price },
      beds: { integerValue: String(property.beds) },
      baths: { integerValue: String(property.baths) },
      area: { stringValue: property.area },
      type: { stringValue: property.type },
      status: { stringValue: property.status },
      summary: { stringValue: property.summary },
      image: { stringValue: property.image },
      createdAt: { integerValue: String(property.createdAt || Date.now()) },
    },
  };
}

async function readFileStore(): Promise<Property[] | null> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const list = parsed.filter(isProperty);
    return list.length ? normalize(list) : null;
  } catch {
    return null;
  }
}

async function writeFileStore(list: Property[]) {
  const next = normalize(list);
  cache = next;
  try {
    await mkdir(path.dirname(FILE_PATH), { recursive: true });
    await writeFile(FILE_PATH, JSON.stringify(next, null, 2), "utf8");
  } catch {
    // Vercel app disk is read-only; /tmp or memory is enough for this request.
  }
}

async function listFromFirestore(): Promise<Property[] | null> {
  const projectId = firebaseProjectId();
  const apiKey = firebaseApiKey();
  if (!projectId || !apiKey) return null;

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}?key=${encodeURIComponent(apiKey)}&pageSize=100`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      documents?: {
        name?: string;
        fields?: Record<string, { stringValue?: string; integerValue?: string }>;
      }[];
    };
    if (!Array.isArray(data.documents) || data.documents.length === 0) {
      return [];
    }
    const list = data.documents
      .map((doc) => {
        const id = doc.name?.split("/").pop() || "";
        return propertyFromFields(doc.fields, id);
      })
      .filter((item): item is Property => Boolean(item));
    return normalize(list);
  } catch (error) {
    console.warn("[listings] firestore list skipped", error);
    return null;
  }
}

async function staffIdToken(): Promise<string | null> {
  const apiKey = firebaseApiKey();
  const email =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ||
    "";
  const password = process.env.ADMIN_PASSWORD?.trim() || "";
  if (!apiKey || !email || !password) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = (await res.json()) as { idToken?: string };
    return data.idToken || null;
  } catch {
    return null;
  }
}

async function upsertPropertyToFirestore(
  property: Property,
  idToken?: string | null,
): Promise<boolean> {
  // Prefer Admin SDK (bypasses rules) when service account is configured.
  try {
    const db = getAdminFirestore();
    if (db) {
      await db.collection(COLLECTION).doc(property.slug).set({
        slug: property.slug,
        title: property.title,
        location: property.location,
        price: property.price,
        beds: property.beds,
        baths: property.baths,
        area: property.area,
        type: property.type,
        status: property.status,
        summary: property.summary,
        image: property.image,
        createdAt: property.createdAt || Date.now(),
      });
      return true;
    }
  } catch (error) {
    console.warn("[listings] admin sdk write skipped", error);
  }

  const projectId = firebaseProjectId();
  const apiKey = firebaseApiKey();
  if (!projectId || !apiKey) return false;

  const key = encodeURIComponent(apiKey);
  const body = JSON.stringify(toFirestoreFields(property));
  const docPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(property.slug)}?key=${key}`;
  const createPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}?documentId=${encodeURIComponent(property.slug)}&key=${key}`;

  const send = async (url: string, method: "PATCH" | "POST", token: string | null) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    });
  };

  const token = idToken || (await staffIdToken());

  // Create first (starts the `properties` collection if missing), then patch.
  if (token) {
    let res = await send(createPath, "POST", token);
    if (res.ok) return true;
    res = await send(docPath, "PATCH", token);
    if (res.ok) return true;
    const text = await res.text();
    console.warn("[listings] firestore write failed", property.slug, res.status, text);
    return false;
  }

  // Unauthenticated create only if rules allow public create (not recommended).
  const res = await send(createPath, "POST", null);
  if (res.ok) return true;
  const text = await res.text();
  console.warn("[listings] firestore write failed", property.slug, res.status, text);
  return false;
}

async function deletePropertyFromFirestore(
  slug: string,
  idToken?: string | null,
): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    if (db) {
      await db.collection(COLLECTION).doc(slug).delete();
      return true;
    }
  } catch (error) {
    console.warn("[listings] admin sdk delete skipped", error);
  }

  const projectId = firebaseProjectId();
  const apiKey = firebaseApiKey();
  if (!projectId || !apiKey) return false;
  const token = idToken || (await staffIdToken());
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(slug)}?key=${encodeURIComponent(apiKey)}`,
      { method: "DELETE", headers, signal: AbortSignal.timeout(15000) },
    );
    // 404 = already gone (treat as success for sync purposes)
    if (res.ok || res.status === 404) return true;
    const text = await res.text();
    console.warn("[listings] firestore delete failed", slug, res.status, text);
    return false;
  } catch (error) {
    console.warn("[listings] firestore delete skipped", error);
    return false;
  }
}

async function seedFirestore(list: Property[]) {
  if (seedInFlight) return seedInFlight;
  seedInFlight = (async () => {
    const token = await staffIdToken();
    for (const property of list) {
      await upsertPropertyToFirestore(property, token);
    }
  })().finally(() => {
    seedInFlight = null;
  });
  return seedInFlight;
}

async function getPropertyFromFirestore(slug: string): Promise<Property | null> {
  const projectId = firebaseProjectId();
  const apiKey = firebaseApiKey();
  if (!projectId || !apiKey || !slug) return null;

  try {
    const db = getAdminFirestore();
    if (db) {
      const snap = await db.collection(COLLECTION).doc(slug).get();
      if (!snap.exists) return null;
      const data = snap.data() || {};
      return propertyFromFields(
        Object.fromEntries(
          Object.entries(data).map(([key, value]) => {
            if (typeof value === "number") {
              return [key, { integerValue: String(value) }];
            }
            return [key, { stringValue: String(value ?? "") }];
          }),
        ),
        slug,
      );
    }
  } catch (error) {
    console.warn("[listings] admin sdk get skipped", error);
  }

  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(slug)}?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      fields?: Record<string, { stringValue?: string; integerValue?: string }>;
    };
    return propertyFromFields(data.fields, slug);
  } catch (error) {
    console.warn("[listings] firestore get skipped", error);
    return null;
  }
}

/** Ensure local + Firestore hold the catalogue (seeds all 9 if empty). */
export async function listProperties(): Promise<Property[]> {
  // Prefer live Firestore catalogue whenever it has documents.
  const fromCloud = await listFromFirestore();
  if (fromCloud && fromCloud.length > 0) {
    await writeFileStore(fromCloud);
    return fromCloud;
  }

  if (cache !== null && cache.length > 0) return cache;

  const seed = normalize(seedProperties);
  const stored = await readFileStore();
  const local = stored && stored.length > 0 ? stored : seed;
  await writeFileStore(local);

  // Cloud empty → push full catalogue.
  void seedFirestore(local);

  return local;
}

export async function getPropertyBySlug(
  slug: string,
): Promise<Property | undefined> {
  const fromCloud = await getPropertyFromFirestore(slug);
  if (fromCloud) return fromCloud;
  const list = await listProperties();
  return list.find((item) => item.slug === slug);
}

/** Resolve full property records for saved shortlist slugs from Firestore first. */
export async function getPropertiesBySlugs(
  slugs: string[],
): Promise<Property[]> {
  const unique = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
  if (!unique.length) return [];

  const resolved = await Promise.all(
    unique.map(async (slug) => {
      const fromCloud = await getPropertyFromFirestore(slug);
      return fromCloud;
    }),
  );

  const bySlug = new Map(
    resolved
      .filter((item): item is Property => Boolean(item))
      .map((item) => [item.slug, item]),
  );

  const missing = unique.filter((slug) => !bySlug.has(slug));
  if (missing.length) {
    const list = await listProperties();
    for (const property of list) {
      if (missing.includes(property.slug)) {
        bySlug.set(property.slug, property);
      }
    }
  }

  return unique
    .map((slug) => bySlug.get(slug))
    .filter((item): item is Property => Boolean(item));
}

export async function getPropertiesByType(
  type?: PropertyType,
): Promise<Property[]> {
  const list = await listProperties();
  if (!type) return list;
  return list.filter((item) => item.type === type);
}

export async function filterLiveSlugs(slugs: string[]): Promise<string[]> {
  const list = await listProperties();
  const set = new Set(list.map((item) => item.slug));
  return slugs.filter((slug) => set.has(slug));
}

export type PropertyInput = {
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  type?: PropertyType;
  status?: PropertyStatus;
  summary: string;
  image: string;
  slug?: string;
};

function uniqueSlug(base: string, existing: Property[], ignore?: string) {
  let slug = base || `property-${Date.now()}`;
  let n = 2;
  while (existing.some((item) => item.slug === slug && item.slug !== ignore)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function createProperty(
  input: PropertyInput,
  idToken?: string | null,
): Promise<{ property: Property; firestore: boolean }> {
  const list = await listProperties();
  const base = slugifyTitle(input.slug || input.title);
  const property: Property = {
    slug: uniqueSlug(base, list),
    title: input.title.trim(),
    location: input.location.trim(),
    price: input.price.trim(),
    beds: Number(input.beds) || 0,
    baths: Number(input.baths) || 0,
    area: input.area.trim(),
    type: input.type === "sale" ? "sale" : "rent",
    status:
      input.status ||
      (input.type === "sale" ? "For Sale" : "For Rent"),
    summary: input.summary.trim(),
    image: input.image.trim(),
    createdAt: Date.now(),
  };
  await writeFileStore([property, ...list]);
  const firestore = await upsertPropertyToFirestore(property, idToken);
  return { property, firestore };
}

export async function updateProperty(
  slug: string,
  input: Partial<PropertyInput> & { createdAt?: number },
  idToken?: string | null,
): Promise<{
  property: Property;
  previousSlug: string | null;
  firestore: boolean;
} | null> {
  const list = await listProperties();
  const index = list.findIndex((item) => item.slug === slug);
  if (index < 0) return null;
  const current = list[index]!;
  const nextSlug = input.slug
    ? uniqueSlug(slugifyTitle(input.slug), list, slug)
    : current.slug;
  const updated: Property = {
    ...current,
    title: input.title?.trim() ?? current.title,
    location: input.location?.trim() ?? current.location,
    price: input.price?.trim() ?? current.price,
    beds: input.beds !== undefined ? Number(input.beds) || 0 : current.beds,
    baths: input.baths !== undefined ? Number(input.baths) || 0 : current.baths,
    area: input.area?.trim() ?? current.area,
    type: input.type === "sale" || input.type === "rent" ? input.type : current.type,
    status: input.status ?? current.status,
    summary: input.summary?.trim() ?? current.summary,
    image: input.image?.trim() ?? current.image,
    slug: nextSlug,
    createdAt: input.createdAt ?? current.createdAt,
  };
  const next = [...list];
  next[index] = updated;
  await writeFileStore(next);
  if (slug !== nextSlug) {
    await deletePropertyFromFirestore(slug, idToken);
  }
  const firestore = await upsertPropertyToFirestore(updated, idToken);
  return {
    property: updated,
    previousSlug: slug !== nextSlug ? slug : null,
    firestore,
  };
}

export async function deleteProperty(
  slug: string,
  idToken?: string | null,
): Promise<{ removed: boolean; firestore: boolean }> {
  const list = await listProperties();
  const next = list.filter((item) => item.slug !== slug);
  if (next.length === list.length) return { removed: false, firestore: false };
  await writeFileStore(next);
  const firestore = await deletePropertyFromFirestore(slug, idToken);
  return { removed: true, firestore };
}

/** Force-write the seed catalogue into local + Firestore. */
export async function seedAllListings(): Promise<Property[]> {
  const seed = normalize(seedProperties);
  await writeFileStore(seed);
  await seedFirestore(seed);
  return seed;
}

export function invalidateListingsCache() {
  cache = null;
}
