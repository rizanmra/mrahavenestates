import { createHmac, timingSafeEqual } from "node:crypto";
import { DEFAULT_ADMIN_EMAIL } from "@/lib/admin";

export const STAFF_SESSION_COOKIE = "mra_staff_session";

function adminEmail() {
  return (
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase() ||
    DEFAULT_ADMIN_EMAIL
  );
}

function signingSecret() {
  return (
    process.env.ADMIN_PASSWORD?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    `mra-staff:${adminEmail()}:${process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || "dev"}`
  );
}

function sign(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function passwordsMatch(given: string, expected: string) {
  const left = createHmac("sha256", "mra-staff").update(given).digest();
  const right = createHmac("sha256", "mra-staff").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function createStaffSessionToken(email: string): string | null {
  if (!email.trim()) return null;
  const payload = Buffer.from(
    JSON.stringify({
      email: email.trim().toLowerCase(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyStaffSessionToken(token: string): string | null {
  if (!token.includes(".")) return null;
  const dot = token.lastIndexOf(".");
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: string;
      exp?: number;
    };
    const email = String(parsed.email ?? "").trim().toLowerCase();
    if (!email || email !== adminEmail()) return null;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return email;
  } catch {
    return null;
  }
}

export function staffPasswordMatches(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim() || "";
  if (!expected) return false;
  return passwordsMatch(password, expected);
}

export function readStaffSessionCookie(request: Request): string | null {
  const header = request.headers.get("cookie") || "";
  const parts = header.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (name === STAFF_SESSION_COOKIE) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export function staffCookieHeader(token: string | null): string {
  const parts = [
    `${STAFF_SESSION_COOKIE}=${token ? encodeURIComponent(token) : ""}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + (token ? String(60 * 60 * 24 * 7) : "0"),
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}
