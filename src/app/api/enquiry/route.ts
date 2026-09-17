import { NextResponse } from "next/server";
import { isReservedStaffEmail } from "@/lib/admin";
import {
  newEnquiryId,
  readAssignedAdminEmail,
  savePublicEnquiry,
} from "@/lib/enquiry-inbox";
import { getContactReason, isContactReasonId } from "@/data/contact-reasons";
import {
  formatPhoneForStorage,
  validateEmail,
  validateName,
  validatePhone,
} from "@/lib/form-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type EnquiryPayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
  source?: string;
  /** Contact Us reason id (ignored for property-enquiry). */
  reason?: string;
  allowMissingPhone?: boolean;
  property?: {
    slug: string;
    title: string;
    location: string;
    price: string;
    status: string;
    type: string;
    beds: number;
    baths: number;
    area: string;
  };
};

function parseProperty(
  raw: EnquiryPayload["property"] | undefined,
): EnquiryPayload["property"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const slug = String(raw.slug ?? "").trim();
  const title = String(raw.title ?? "").trim();
  if (!slug || !title) return undefined;
  return {
    slug,
    title,
    location: String(raw.location ?? "").trim() || "—",
    price: String(raw.price ?? "").trim() || "—",
    status: String(raw.status ?? "").trim() || "—",
    type: String(raw.type ?? "").trim() || "—",
    beds: Number(raw.beds) || 0,
    baths: Number(raw.baths) || 0,
    area: String(raw.area ?? "").trim() || "—",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<EnquiryPayload>;
    const name = String(body.name ?? "");
    const email = String(body.email ?? "");
    const phone = String(body.phone ?? "");
    const message = String(body.message ?? "").trim();
    const source = String(body.source ?? "contact").trim() || "contact";
    const reasonId = String(body.reason ?? "general").trim() || "general";
    const property = parseProperty(body.property);

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Please enter a message." },
        { status: 400 },
      );
    }

    if (source === "contact" && !isContactReasonId(reasonId)) {
      return NextResponse.json(
        { ok: false, error: "Please select a reason for your enquiry." },
        { status: 400 },
      );
    }

    if (source === "property-enquiry" && !property) {
      return NextResponse.json(
        { ok: false, error: "Please select a property to enquire about." },
        { status: 400 },
      );
    }

    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(
      phone,
      Boolean(phone.trim()) || !body.allowMissingPhone,
    );
    const firstError = nameError || emailError || phoneError;
    if (firstError) {
      return NextResponse.json({ ok: false, error: firstError }, { status: 400 });
    }

    const cleanName = name.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();
    const assignedAdminEmail = await readAssignedAdminEmail();
    if (
      isReservedStaffEmail(cleanEmail) ||
      (assignedAdminEmail && assignedAdminEmail === cleanEmail)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Staff accounts cannot submit client enquiries. Use the staff portal instead.",
        },
        { status: 403 },
      );
    }
    const cleanPhone = phone.trim()
      ? formatPhoneForStorage(phone)
      : "Not provided";
    const reason = getContactReason(reasonId);
    const listing = property ?? {
      slug: `contact-${reasonId}`,
      title: `Contact — ${reason.label}`,
      location: "Website contact form",
      price: "—",
      status: "Contact",
      type: "contact",
      beds: 0,
      baths: 0,
      area: "—",
    };

    try {
      const enquiry = {
        id: newEnquiryId(),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        message:
          source === "contact" ? `[${reason.label}] ${message}` : message,
        property: listing,
        createdAt: Date.now(),
        read: false,
        status: "open" as const,
      };
      await savePublicEnquiry(enquiry);

      // Inbox only — no SMTP / FormSubmit until the client configures email.
      return NextResponse.json({ ok: true, deliveredTo: "admin", enquiry });
    } catch (error) {
      console.error("[enquiry] admin inbox", error);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not send your message just now. Please call us or try again.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[enquiry]", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not send your message just now. Please call us or try again.",
      },
      { status: 500 },
    );
  }
}
