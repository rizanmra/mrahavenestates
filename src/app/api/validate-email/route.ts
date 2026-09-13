import { promises as dns } from "node:dns";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const DISPOSABLE = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        {
          valid: false,
          error: "Please enter a valid email address (for example name@email.com).",
        },
        { status: 400 },
      );
    }

    const domain = email.split("@")[1] ?? "";
    if (DISPOSABLE.has(domain)) {
      return NextResponse.json(
        {
          valid: false,
          error: "Please use a permanent email address, not a temporary one.",
        },
        { status: 400 },
      );
    }

    try {
      const mx = await dns.resolveMx(domain);
      if (!mx?.length) {
        return NextResponse.json(
          {
            valid: false,
            error:
              "That email domain doesn’t appear to accept mail. Please check for typos.",
          },
          { status: 400 },
        );
      }
    } catch {
      // Fallback: try A record (some domains use A instead of MX)
      try {
        await dns.resolve4(domain);
      } catch {
        return NextResponse.json(
          {
            valid: false,
            error:
              "We couldn’t verify that email domain. Please check the address and try again.",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ valid: true, email });
  } catch (error) {
    console.error("[validate-email]", error);
    return NextResponse.json(
      { valid: false, error: "Email check failed. Please try again." },
      { status: 502 },
    );
  }
}
