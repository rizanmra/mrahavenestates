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
};

export type SavedPropertyRecord = {
  slug: string;
  savedAt: number;
};

export type PortalEnquiry = {
  id: string;
  type: "contact" | "valuation";
  summary: string;
  createdAt: number;
};

const USERS_KEY = "mra-portal-users";
const SESSION_KEY = "mra-portal-session";
const SAVED_KEY = "mra-portal-saved";
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

  const user: PortalUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    passwordHash: await hashPassword(input.password),
    createdAt: Date.now(),
  };

  writeJson(USERS_KEY, [...users, user]);
  const session = { userId: user.id, email: user.email, name: user.name };
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

  const session = { userId: user.id, email: user.email, name: user.name };
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

export function getEnquiries(userId: string): PortalEnquiry[] {
  return readJson<PortalEnquiry[]>(enquiriesKey(userId), []);
}

export function addEnquiry(
  userId: string,
  enquiry: Omit<PortalEnquiry, "id" | "createdAt">,
) {
  const next: PortalEnquiry = {
    ...enquiry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  writeJson(enquiriesKey(userId), [next, ...getEnquiries(userId)].slice(0, 20));
}
