/** Public admin helpers — safe to import from client components. */

export type AssignedAdmin = {
  userId: string;
  email: string;
};

/** Always treated as staff, even if the first-user claim has not loaded yet. */
export const STAFF_EMAILS = ["mrahavenestates@gmail.com"] as const;

let cachedAdmin: AssignedAdmin | null = null;

export function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

export function isReservedStaffEmail(
  email: string | null | undefined,
): boolean {
  const normalized = normalizeEmail(email);
  return STAFF_EMAILS.some((item) => item === normalized);
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

/** Reserved staff email, first-user claim, or a session already marked admin. */
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
