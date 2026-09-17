/** Public admin helpers — safe to import from client components. */

export type AssignedAdmin = {
  userId: string;
  email: string;
};

/** Always treated as staff (matches ADMIN / NEXT_PUBLIC_ADMIN_EMAIL). */
export const STAFF_EMAILS = ["mrahavenestates@gmail.com"] as const;

let cachedAdmin: AssignedAdmin | null = null;

export function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

/** Reserved emails + NEXT_PUBLIC_ADMIN_EMAIL from env. */
function reservedStaffEmails(): string[] {
  const fromEnv = normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL);
  const list: string[] = [...STAFF_EMAILS];
  if (fromEnv && !list.includes(fromEnv)) list.push(fromEnv);
  return list;
}

export function isReservedStaffEmail(
  email: string | null | undefined,
): boolean {
  const normalized = normalizeEmail(email);
  return reservedStaffEmails().some((item) => item === normalized);
}

export function getCachedAdmin(): AssignedAdmin | null {
  return cachedAdmin;
}

export function setCachedAdmin(admin: AssignedAdmin | null) {
  cachedAdmin = admin;
}

export function isAdminAccount(
  email: string | null | undefined,
  userId?: string | null,
): boolean {
  if (!cachedAdmin) return false;
  if (userId && cachedAdmin.userId === userId) return true;
  const normalized = normalizeEmail(email);
  return Boolean(normalized && cachedAdmin.email === normalized);
}

/** Reserved staff email or assigned config/admin account. */
export function isAdminEmail(
  email: string | null | undefined,
  userId?: string | null,
): boolean {
  return isReservedStaffEmail(email) || isAdminAccount(email, userId);
}

export function sessionIsAdmin(
  session:
    | {
        email?: string;
        userId?: string;
        isAdmin?: boolean;
      }
    | null
    | undefined,
): boolean {
  if (!session) return false;
  return Boolean(session.isAdmin) || isAdminEmail(session.email, session.userId);
}
