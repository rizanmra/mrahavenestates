import { NextResponse } from "next/server";
import {
  listInboxRowsForEmail,
  lookupFirebaseUser,
} from "@/lib/admin-server";
import { inboxToPortalEnquiry } from "@/lib/enquiry-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Inbox rows for the signed-in client — including guest submissions later claimed by email. */
export async function GET(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Sign in to load enquiries." },
      { status: 401 },
    );
  }

  const user = await lookupFirebaseUser(token);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to load enquiries." },
      { status: 401 },
    );
  }

  const rows = await listInboxRowsForEmail(user.email);
  return NextResponse.json({
    ok: true,
    enquiries: rows.map((item) => inboxToPortalEnquiry(item, user.userId)),
  });
}
