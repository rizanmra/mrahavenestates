/** Shared client-side validation for contact / register fields. */

import { normalisePostcode } from "@/lib/land-registry";

const NAME_PATTERN = /^[A-Za-z][A-Za-z'’\- ]{1,78}[A-Za-z]$|^[A-Za-z]{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** UK numbers: landline/mobile starting 01, 02, 03, 07, 08 (11 digits with leading 0). */
const UK_PHONE_PATTERN = /^(?:0(?:1\d{8,9}|2\d{9}|3\d{9}|7\d{9}|8\d{9}))$/;

export function normalizePhone(input: string): string {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+44")) {
    digits = `0${digits.slice(3)}`;
  } else if (digits.startsWith("44") && digits.length >= 12) {
    digits = `0${digits.slice(2)}`;
  }
  return digits.replace(/\D/g, "");
}

export function validateName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 2) return "Please enter your full name.";
  if (/\d/.test(name)) return "Name can’t include numbers.";
  if (!NAME_PATTERN.test(name)) {
    return "Use letters only (spaces, hyphens and apostrophes are fine).";
  }
  return null;
}

export function validateEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (!email) return "Please enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "Please enter a valid email address.";
  return null;
}

export function validatePhone(input: string, required = true): string | null {
  const raw = input.trim();
  if (!raw) {
    return required ? "Please enter your phone number." : null;
  }
  const phone = normalizePhone(raw);
  if (!UK_PHONE_PATTERN.test(phone)) {
    return "Enter a valid UK phone number (e.g. 07xxx or 01xxx, 11 digits).";
  }
  return null;
}

export function formatPhoneForStorage(input: string): string {
  return normalizePhone(input);
}

/** Full UK postcode as “SW1A 1AA”. Returns null if incomplete/invalid. */
export function formatUkPostcode(input: string): string | null {
  return normalisePostcode(input);
}

export function validateUkPostcode(input: string): string | null {
  if (!formatUkPostcode(input)) {
    return "Enter a full UK postcode (e.g. BD1 5AH).";
  }
  return null;
}

/**
 * UK-style street address line: title case, tidy spacing/commas.
 * Example: "17 rectory road, stoke" → "17 Rectory Road, Stoke"
 */
export function formatUkAddressLine(input: string): string {
  const cleaned = input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,+/g, ",")
    .replace(/^,|,$/g, "");
  if (!cleaned) return "";

  const small = new Set([
    "and",
    "of",
    "the",
    "in",
    "on",
    "at",
    "to",
    "for",
    "by",
  ]);

  return cleaned
    .split(", ")
    .map((segment) =>
      segment
        .split(" ")
        .map((word, index) => {
          if (!word) return word;
          if (/^\d+$/.test(word)) return word;
          if (/^\d+[a-z]+$/i.test(word)) {
            const digits = word.match(/^\d+/)?.[0] ?? "";
            const rest = word.slice(digits.length);
            return `${digits}${rest.charAt(0).toUpperCase()}${rest.slice(1).toLowerCase()}`;
          }
          const lower = word.toLowerCase();
          if (index > 0 && small.has(lower)) return lower;
          if (word.includes("-")) {
            return word
              .split("-")
              .map((part) =>
                part
                  ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                  : part,
              )
              .join("-");
          }
          if (word.includes("'")) {
            return word
              .split("'")
              .map((part) =>
                part
                  ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                  : part,
              )
              .join("'");
          }
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" "),
    )
    .join(", ");
}

/** Show enough of an email to recognise it, hide the middle. */
export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "••••@••••";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const keep = Math.min(2, local.length);
  const hidden = Math.max(3, local.length - keep);
  return `${local.slice(0, keep)}${"•".repeat(hidden)}@${domain}`;
}

/** Show start + end of a UK phone, hide the middle. */
export function maskPhone(phone: string): string {
  const digits = normalizePhone(phone);
  if (!digits) return "•••••••••••";
  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}${"•".repeat(Math.max(3, digits.length - 2))}`;
  }
  return `${digits.slice(0, 3)}${"•".repeat(digits.length - 6)}${digits.slice(-3)}`;
}
