import { NextResponse } from "next/server";
import { isReservedStaffEmail } from "@/lib/admin";
import {
  resolveAdminAccess,
  getAssignedAdmin,
  lookupFirebaseUser,
} from "@/lib/admin-server";
import {
  createStaffSessionToken,
  readStaffSessionCookie,
  staffCookieHeader,
  verifyStaffSessionToken,
} from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function staffProfile(email: string, userId: string) {
  return {
    ok: true as const,
    userId,
    email,
    name: process.env.ADMIN_NAME?.trim() || "MRA Admin",
    phone: process.env.ADMIN_PHONE?.trim() || "",
    isAdmin: true as const,
  };
}

export async function GET(request: Request) {
  const email = verifyStaffSessionToken(readStaffSessionCookie(request) || "");
  if (!email) {
    return NextResponse.json({ ok: false });
  }
  const assigned = await getAssignedAdmin();
  if (
    !isReservedStaffEmail(email) &&
    (!assigned || assigned.email !== email)
  ) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json(
    staffProfile(email, assigned?.userId || "staff"),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as { idToken?: string };
  const idToken = String(body.idToken ?? "").trim();
  const user = await lookupFirebaseUser(idToken);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Incorrect email or password." },
      { status: 401 },
    );
  }

  if (isReservedStaffEmail(user.email)) {
    const token = createStaffSessionToken(user.email);
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Staff session could not be created." },
        { status: 503 },
      );
    }
    const res = NextResponse.json(staffProfile(user.email, user.userId));
    res.headers.set("Set-Cookie", staffCookieHeader(token));
    return res;
  }

  const access = await resolveAdminAccess(user, idToken);
  if (!access.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Admin access only." },
      { status: 403 },
    );
  }

  const token = createStaffSessionToken(user.email);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Staff session could not be created." },
      { status: 503 },
    );
  }

  const res = NextResponse.json(staffProfile(user.email, user.userId));
  res.headers.set("Set-Cookie", staffCookieHeader(token));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", staffCookieHeader(null));
  return res;
}
