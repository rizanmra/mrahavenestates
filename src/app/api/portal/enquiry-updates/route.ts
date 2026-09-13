import { NextResponse } from "next/server";
import {
  listInboxStatusUpdatesForEmail,
  lookupFirebaseEmail,
} from "@/lib/admin-server";
import { listClientEnquiryStatusUpdates } from "@/lib/client-enquiry-updates";

/**
 * Soft client sync for staff reply/close status (local demo + fallback).
 * Only returns updates for the authenticated user — never for an arbitrary email.
 */
export async function GET(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const url = new URL(request.url);
  const claimedIds = new Set(
    (url.searchParams.get("ids") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );

  let email = "";

  if (token) {
    email = (await lookupFirebaseEmail(token)) || "";
  } else {
    // Demo / no Firebase: email alone is not enough — only return updates for
    // sourceEnquiryIds the client already stores on their own account.
    const demoEmail =
      request.headers.get("x-user-email")?.trim().toLowerCase() || "";
    if (!demoEmail.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Sign in to load enquiry updates." },
        { status: 401 },
      );
    }
    if (claimedIds.size === 0) {
      return NextResponse.json({ ok: true, updates: [] });
    }
    email = demoEmail;
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Sign in to load enquiry updates." },
      { status: 401 },
    );
  }

  const [fileUpdates, inboxUpdates] = await Promise.all([
    listClientEnquiryStatusUpdates(email),
    listInboxStatusUpdatesForEmail(email),
  ]);
  const merged = new Map<
    string,
    { sourceEnquiryId: string; status: "answered" | "closed"; reply: string; repliedAt: number }
  >();
  for (const item of [...fileUpdates, ...inboxUpdates]) {
    const prev = merged.get(item.sourceEnquiryId);
    if (!prev || item.repliedAt >= prev.repliedAt) {
      merged.set(item.sourceEnquiryId, item);
    }
  }
  const updates = [...merged.values()];
  const scoped =
    claimedIds.size > 0
      ? updates.filter((item) => claimedIds.has(item.sourceEnquiryId))
      : updates;

  return NextResponse.json({
    ok: true,
    updates: scoped.map(({ sourceEnquiryId, status, reply, repliedAt }) => ({
      sourceEnquiryId,
      status,
      reply,
      repliedAt,
    })),
  });
}
