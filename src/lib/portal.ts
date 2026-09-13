import { getPublicAdminEmail, isAdminEmail } from "@/lib/admin";

export type PortalUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: number;
};

export type PortalSession = {
  userId: string;
  email: string;
  name: string;
  phone?: string;
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

/** Keep only enquiries that belong to this account (legacy items without owner are kept). */
export function filterOwnEnquiries(
  userId: string,
  email: string,
  list: PortalEnquiry[],
): PortalEnquiry[] {
  const normalizedEmail = email.trim().toLowerCase();
  return list.filter((item) => {
    if (item.ownerUserId) return item.ownerUserId === userId;
    if (item.ownerEmail) {
      return item.ownerEmail.trim().toLowerCase() === normalizedEmail;
    }
    // Legacy rows written before ownership fields — already stored under this userId key.
    return true;
  });
}

const USERS_KEY = "mra-portal-users";
const SESSION_KEY = "mra-portal-session";
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

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getUsers(): PortalUser[] {
  return readJson<PortalUser[]>(USERS_KEY, []);
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

export async function ensureDemoAdminAccount() {
  const email = getPublicAdminEmail();
  const users = getUsers();
  if (users.some((user) => user.email === email)) return;

  const password = "HavenAdmin2026!";
  const user: PortalUser = {
    id: "mra-staff-admin",
    name: "MRA Admin",
    email,
    phone: "03301333786",
    passwordHash: await hashPassword(password),
    createdAt: Date.now(),
  };
  writeJson(USERS_KEY, [...users, user]);
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<PortalSession> {
  const email = input.email.trim().toLowerCase();
  const users = getUsers();

  if (users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (isAdminEmail(email)) {
    throw new Error("This email is reserved for staff. Please log in instead.");
  }

  const user: PortalUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    passwordHash: await hashPassword(input.password),
    createdAt: Date.now(),
  };

  writeJson(USERS_KEY, [...users, user]);
  const session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
  };
  setSession(session);
  return session;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<PortalSession> {
  const email = input.email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((item) => item.email === email);

  if (!user) {
    throw new Error("No account found for this email.");
  }

  const hash = await hashPassword(input.password);
  if (hash !== user.passwordHash) {
    throw new Error("Incorrect password.");
  }

  const session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
  };
  setSession(session);
  return session;
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
  const next = getEnquiries(userId).map((item) => {
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
