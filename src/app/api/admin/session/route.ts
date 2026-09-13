import { NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/admin-server";
import {
  createStaffSessionToken,
  readStaffSessionCookie,
  staffCookieHeader,
  staffPasswordMatches,
  verifyStaffSessionToken,
} from "@/lib/admin-session";

function staffProfile(email: string) {
  return {
    ok: true as const,
    userId: "mra-staff-admin",
    email,
    name: process.env.ADMIN_NAME?.trim() || "MRA Admin",
    phone: process.env.ADMIN_PHONE?.trim() || "",
  };
}

export async function GET(request: Request) {
  const email = verifyStaffSessionToken(readStaffSessionCookie(request) || "");
  if (!email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json(staffProfile(email));
}

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (email !== getAdminEmail() || !staffPasswordMatches(password)) {
    return NextResponse.json(
      { ok: false, error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  const token = createStaffSessionToken(email);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Staff password is not configured on the server." },
      { status: 503 },
    );
  }

  const res = NextResponse.json(staffProfile(email));
  res.headers.set("Set-Cookie", staffCookieHeader(token));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", staffCookieHeader(null));
  return res;
}
