/** Public admin helpers — safe to import from client components. */

export const DEFAULT_ADMIN_EMAIL = "admin@mrahavenestates.co.uk";

export function getPublicAdminEmail(): string {
  return (
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ||
    DEFAULT_ADMIN_EMAIL
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getPublicAdminEmail();
}
