/** Public admin helpers — safe to import from client components. */

export type AssignedAdmin = {
  userId: string;
  email: string;
};

let cachedAdmin: AssignedAdmin | null = null;

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
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && cachedAdmin.email === normalized);
}
