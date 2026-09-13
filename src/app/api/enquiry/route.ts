import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  newPropertyEnquiryId,
  savePropertyEnquiry,
} from "@/lib/admin-server";
import { isAdminEmail } from "@/lib/admin";
import { getContactReason, isContactReasonId } from "@/data/contact-reasons";
import {
  formatPhoneForStorage,
  validateEmail,
  validateName,
  validatePhone,
} from "@/lib/form-validation";

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

type DeliveryInput = {
  to: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  reasonLabel: string;
  reasonSubject: string;
  property?: EnquiryPayload["property"];
};

function inboxAddress() {
  return (
    process.env.CONTACT_INBOX_EMAIL?.trim() ||
    "abdullahshakil1503@gmail.com"
  );
}

function smtpConfigured() {
  return Boolean(
    process.env.CONTACT_SMTP_USER?.trim() &&
      process.env.CONTACT_SMTP_PASS?.trim(),
  );
}

function propertyLines(property: NonNullable<EnquiryPayload["property"]>) {
  return [
    `Property: ${property.title}`,
    `Slug: ${property.slug}`,
    `Location: ${property.location}`,
    `Price: ${property.price}`,
    `Status: ${property.status}`,
    `Type: ${property.type}`,
    `Bedrooms / Baths / Area: ${property.beds} / ${property.baths} / ${property.area}`,
    `Listing URL: /properties/${property.slug}`,
  ];
}

function propertyHtmlRows(property: NonNullable<EnquiryPayload["property"]>) {
  const rows: [string, string][] = [
    ["Property", property.title],
    ["Slug", property.slug],
    ["Location", property.location],
    ["Price", property.price],
    ["Status", property.status],
    ["Type", property.type],
    ["Bedrooms", String(property.beds)],
    ["Baths", String(property.baths)],
    ["Area", property.area],
    ["Listing", `/properties/${property.slug}`],
  ];
  return rows
    .map(
      ([label, value]) =>
        `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");
}

async function deliverViaSmtp(input: DeliveryInput) {
  const user = process.env.CONTACT_SMTP_USER!.trim();
  const pass = process.env.CONTACT_SMTP_PASS!.trim();
  const host = process.env.CONTACT_SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.CONTACT_SMTP_PORT || "465");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const subjectProperty = input.property
    ? ` — ${input.property.title}`
    : "";
  const subject =
    input.source === "contact"
      ? `MRA Haven Estates — ${input.reasonSubject}${subjectProperty}`
      : `MRA Haven Estates enquiry (${input.source})${subjectProperty}`;

  await transporter.sendMail({
    from: `"MRA Haven Estates" <${user}>`,
    to: input.to,
    replyTo: input.email,
    subject,
    text: [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Phone: ${input.phone}`,
      `Source: ${input.source}`,
      `Reason: ${input.reasonLabel}`,
      ...(input.property ? ["", ...propertyLines(input.property)] : []),
      "",
      input.message,
    ].join("\n"),
    html: `
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        <tr><td><strong>Name</strong></td><td>${escapeHtml(input.name)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escapeHtml(input.email)}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${escapeHtml(input.phone)}</td></tr>
        <tr><td><strong>Source</strong></td><td>${escapeHtml(input.source)}</td></tr>
        <tr><td><strong>Reason</strong></td><td>${escapeHtml(input.reasonLabel)}</td></tr>
        ${input.property ? propertyHtmlRows(input.property) : ""}
        <tr><td valign="top"><strong>Message</strong></td><td>${escapeHtml(input.message).replace(/\n/g, "<br>")}</td></tr>
      </table>
    `,
  });

  return { ok: true as const };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function deliverViaFormSubmit(input: DeliveryInput) {
  const subject =
    input.source === "contact"
      ? `MRA Haven Estates — ${input.reasonSubject}${
          input.property ? ` — ${input.property.title}` : ""
        }`
      : `MRA Haven Estates enquiry (${input.source})${
          input.property ? ` — ${input.property.title}` : ""
        }`;

  const payload: Record<string, string> = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    message: input.message,
    source: input.source,
    reason: input.reasonLabel,
    _subject: subject,
    _template: "table",
    _captcha: "false",
    _replyto: input.email,
  };

  if (input.property) {
    payload.property = input.property.title;
    payload.property_slug = input.property.slug;
    payload.property_location = input.property.location;
    payload.property_price = input.property.price;
    payload.property_status = input.property.status;
    payload.property_type = input.property.type;
    payload.property_details = `${input.property.beds} bedrooms · ${input.property.baths} baths · ${input.property.area}`;
    payload.property_url = `/properties/${input.property.slug}`;
  }

  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    try {
      const res = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(input.to)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(25000),
        },
      );

      lastStatus = res.status;
      lastBody = await res.text();

      if (!res.ok) {
        if (res.status < 500 && res.status !== 408 && res.status !== 429) {
          break;
        }
        continue;
      }

      try {
        const parsed = JSON.parse(lastBody) as {
          success?: string | boolean;
          message?: string;
        };
        const message = String(parsed.message ?? "").toLowerCase();
        const needsActivation =
          message.includes("confirm") ||
          message.includes("activate") ||
          message.includes("activation");
        if (needsActivation) {
          return {
            ok: false as const,
            status: lastStatus,
            body: lastBody,
            activationRequired: true,
          };
        }
      } catch {
        // Non-JSON success body — treat as delivered.
      }

      return { ok: true as const };
    } catch (error) {
      lastStatus = 0;
      lastBody =
        error instanceof Error ? error.message : "FormSubmit request failed";
    }
  }

  return { ok: false as const, status: lastStatus, body: lastBody };
}

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
    if (isAdminEmail(cleanEmail)) {
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
    if (source === "property-enquiry" && property) {
      try {
        const enquiry = {
          id: newPropertyEnquiryId(),
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          message,
          property,
          createdAt: Date.now(),
          read: false,
          status: "open" as const,
        };
        await savePropertyEnquiry(enquiry);
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
    }

    const to = inboxAddress();
    const reason = getContactReason(reasonId);
    const payload: DeliveryInput = {
      to,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      message,
      source,
      reasonLabel: reason.label,
      reasonSubject: reason.subject,
      property,
    };

    if (smtpConfigured()) {
      try {
        await deliverViaSmtp(payload);
        return NextResponse.json({ ok: true });
      } catch (error) {
        console.error("[enquiry] smtp", error);
        return NextResponse.json(
          {
            ok: false,
            error:
              "Could not send your message just now. Please call us or try again.",
          },
          { status: 502 },
        );
      }
    }

    const delivered = await deliverViaFormSubmit(payload);
    if (!delivered.ok) {
      console.error("[enquiry]", delivered.status, delivered.body);
      if ("activationRequired" in delivered && delivered.activationRequired) {
        console.error(
          "[enquiry] FormSubmit needs inbox activation (confirmation email). Prefer CONTACT_SMTP_* instead.",
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not send your message just now. Please call us or try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
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
