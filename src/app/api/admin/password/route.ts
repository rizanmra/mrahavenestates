import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-server";
import { changeStaffPassword } from "@/lib/staff-password";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { ok: false, error: "Enter your current password and a new password." },
      { status: 400 },
    );
  }

  const result = await changeStaffPassword({ currentPassword, newPassword });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
