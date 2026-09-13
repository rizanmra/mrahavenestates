export type PortalSession = {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  isAdmin?: boolean;
};

export type SavedPropertyRecord = {
  slug: string;
  savedAt: number;
};

export type PortalEnquiry = {
  id: string;
  type: "contact" | "valuation" | "property";
  summary: string;
  createdAt: number;
  /** Set when the enquiry is recorded — used to keep accounts private. */
  ownerUserId?: string;
  ownerEmail?: string;
  status?: "open" | "answered" | "closed";
  reply?: string;
  repliedAt?: number;
  sourceEnquiryId?: string;
};

/** Convert Firestore timestamps / ISO strings into epoch ms. */
export function toEpochMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && asNumber > 0) return asNumber;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (value && typeof value === "object") {
    const rec = value as { toMillis?: () => number; seconds?: number };
    if (typeof rec.toMillis === "function") {
      try {
        const ms = rec.toMillis();
        return Number.isFinite(ms) ? ms : null;
      } catch {
        return null;
      }
    }
    if (typeof rec.seconds === "number") {
      return rec.seconds * 1000;
    }
  }
  return null;
}

export function formatEnquiryWhen(value: unknown): string {
  const ms = toEpochMs(value);
  if (ms == null) return "";
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB");
}

export function normalizePortalEnquiry(raw: unknown): PortalEnquiry | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id.trim() : "";
  const summary = typeof item.summary === "string" ? item.summary : "";
  const createdAt = toEpochMs(item.createdAt);
  const type = item.type;
  if (
    !id ||
    !summary ||
    createdAt == null ||
    (type !== "contact" && type !== "valuation" && type !== "property")
  ) {
    return null;
  }

  const ownerEmail =
    typeof item.ownerEmail === "string"
      ? item.ownerEmail.trim().toLowerCase()
      : "";
  const ownerUserId =
    typeof item.ownerUserId === "string" ? item.ownerUserId : undefined;
  const status =
    item.status === "answered" ||
    item.status === "closed" ||
    item.status === "open"
      ? item.status
      : "open";
  const reply = typeof item.reply === "string" ? item.reply : undefined;
  const repliedAt = toEpochMs(item.repliedAt) ?? undefined;
  const sourceEnquiryId =
    typeof item.sourceEnquiryId === "string"
      ? item.sourceEnquiryId
      : undefined;

  return {
    id,
    type,
    summary,
    createdAt,
    ownerUserId,
    ownerEmail: ownerEmail || undefined,
    status,
    reply,
    repliedAt,
    sourceEnquiryId,
  };
}

export function normalizePortalEnquiries(list: unknown): PortalEnquiry[] {
  if (!Array.isArray(list)) return [];
  return list
    .map(normalizePortalEnquiry)
    .filter((item): item is PortalEnquiry => item !== null);
}

/** Keep only enquiries that belong to this account (legacy items without owner are kept). */
export function filterOwnEnquiries(
  userId: string,
  email: string,
  list: unknown,
): PortalEnquiry[] {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizePortalEnquiries(list).filter((item) => {
    if (item.ownerUserId) return item.ownerUserId === userId;
    if (item.ownerEmail) {
      return item.ownerEmail === normalizedEmail;
    }
    // Legacy rows written before ownership fields — already stored under this userId key.
    return true;
  });
}

const USERS_KEY = "mra-portal-users";
const SESSION_KEY = "mra-portal-session";

/** Remove leftover local username/password copies. Auth is Firebase only. */
export function clearLocalAccounts() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(USERS_KEY);
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore private mode
  }
}
const SAVED_KEY = "mra-portal-saved";
const NEW_SIGNUP_WELCOME_KEY = "mra-portal-new-signup";

/** Mark the next /account visit as post-signup (Welcome, not Welcome back). */
export function markNewSignupWelcome() {
  try {
    sessionStorage.setItem(NEW_SIGNUP_WELCOME_KEY, "1");
  } catch {
    // ignore private mode / unavailable storage
  }
}

/** Read and clear the post-signup welcome flag. */
export function consumeNewSignupWelcome(): boolean {
  try {
    if (sessionStorage.getItem(NEW_SIGNUP_WELCOME_KEY) === "1") {
      sessionStorage.removeItem(NEW_SIGNUP_WELCOME_KEY);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
const ENQUIRIES_KEY = "mra-portal-enquiries";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getSession(): PortalSession | null {
  return readJson<PortalSession | null>(SESSION_KEY, null);
}

export function setSession(session: PortalSession | null) {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  writeJson(SESSION_KEY, session);
}

export function logoutUser() {
  setSession(null);
}

function savedKey(userId: string) {
  return `${SAVED_KEY}:${userId}`;
}

function enquiriesKey(userId: string) {
  return `${ENQUIRIES_KEY}:${userId}`;
}

export function getSavedSlugs(userId: string): SavedPropertyRecord[] {
  return readJson<SavedPropertyRecord[]>(savedKey(userId), []);
}

export function isPropertySaved(userId: string, slug: string): boolean {
  return getSavedSlugs(userId).some((item) => item.slug === slug);
}

export function toggleSavedProperty(userId: string, slug: string): boolean {
  const current = getSavedSlugs(userId);
  const exists = current.some((item) => item.slug === slug);
  const next = exists
    ? current.filter((item) => item.slug !== slug)
    : [...current, { slug, savedAt: Date.now() }];
  writeJson(savedKey(userId), next);
  return !exists;
}

export function replaceSavedSlugs(userId: string, slugs: string[]) {
  writeJson(
    savedKey(userId),
    slugs.map((slug) => ({ slug, savedAt: Date.now() })),
  );
}

export function getEnquiries(
  userId: string,
  email?: string,
): PortalEnquiry[] {
  const list = readJson<PortalEnquiry[]>(enquiriesKey(userId), []);
  if (!email) return list;
  return filterOwnEnquiries(userId, email, list);
}

export function addEnquiry(
  userId: string,
  enquiry: Omit<PortalEnquiry, "id" | "createdAt">,
  ownerEmail?: string,
) {
  const next: PortalEnquiry = {
    ...enquiry,
    ownerUserId: enquiry.ownerUserId || userId,
    ownerEmail: (enquiry.ownerEmail || ownerEmail || "").trim().toLowerCase() ||
      undefined,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  writeJson(
    enquiriesKey(userId),
    [next, ...getEnquiries(userId)].slice(0, 20),
  );
}

/** Apply staff status updates (answered / closed) onto local portal enquiries. */
export function applyEnquiryStatusUpdates(
  userId: string,
  updates: Array<{
    sourceEnquiryId: string;
    status: "answered" | "closed";
    reply: string;
    repliedAt: number;
  }>,
): PortalEnquiry[] {
  if (updates.length === 0) return getEnquiries(userId);
  const byId = new Map(updates.map((item) => [item.sourceEnquiryId, item]));
  let changed = false;
  const next = normalizePortalEnquiries(getEnquiries(userId)).map((item) => {
    // Never invent enquiries from staff updates — only patch this user's rows.
    const sourceId = item.sourceEnquiryId;
    if (!sourceId) return item;
    const update = byId.get(sourceId);
    if (!update) return item;
    if (
      item.status === update.status &&
      item.reply === update.reply &&
      item.repliedAt === update.repliedAt
    ) {
      return item;
    }
    changed = true;
    return {
      ...item,
      status: update.status,
      reply: update.reply,
      repliedAt: update.repliedAt,
    };
  });
  if (changed) writeJson(enquiriesKey(userId), next);
  return next;
}
