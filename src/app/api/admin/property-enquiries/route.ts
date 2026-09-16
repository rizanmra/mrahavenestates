import { NextResponse } from "next/server";
import {
  deletePropertyEnquiry,
  listPropertyEnquiries,
  markPropertyEnquiryRead,
  replyToPropertyEnquiry,
  requireAdminFromRequest,
} from "@/lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const enquiries = await listPropertyEnquiries({ idToken: auth.idToken });
  return NextResponse.json({ ok: true, enquiries });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as {
    id?: string;
    read?: boolean;
    reply?: string;
  };
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing enquiry id." },
      { status: 400 },
    );
  }

  const options = { idToken: auth.idToken };

  if (typeof body.reply === "string") {
    try {
      const enquiry = await replyToPropertyEnquiry({
        id,
        reply: body.reply,
        repliedBy: auth.email,
        idToken: auth.idToken,
      });
      return NextResponse.json({ ok: true, enquiry });
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not send the reply.",
        },
        { status: 502 },
      );
    }
  }

  const enquiry = await markPropertyEnquiryRead(
    id,
    body.read !== false,
    options,
  );
  if (!enquiry) {
    return NextResponse.json(
      { ok: false, error: "Enquiry not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, enquiry });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim() || "";
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing enquiry id." },
      { status: 400 },
    );
  }

  const result = await deletePropertyEnquiry({
    id,
    closedBy: auth.email,
    idToken: auth.idToken,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
