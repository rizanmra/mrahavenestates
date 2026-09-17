import { NextResponse } from "next/server";
import { resolveAdminAccess, lookupFirebaseUser } from "@/lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Sign in to continue." },
      { status: 401 },
    );
  }

  const user = await lookupFirebaseUser(token);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to continue." },
      { status: 401 },
    );
  }

  const result = await resolveAdminAccess(user, token);
  return NextResponse.json({
    ok: true,
    isAdmin: result.isAdmin,
    admin: result.admin,
  });
}
