export type ContactReason = {
  id: string;
  label: string;
  /** Short label used in email subject lines */
  subject: string;
};

/** Reasons shown on Contact Us (property listings use /enquire instead). */
export const contactReasons: ContactReason[] = [
  {
    id: "general",
    label: "General enquiry",
    subject: "General enquiry",
  },
  {
    id: "auction",
    label: "Auction (buy or sell)",
    subject: "Auction",
  },
  {
    id: "careers",
    label: "Careers",
    subject: "Careers",
  },
  {
    id: "conveyancing",
    label: "Conveyancing",
    subject: "Conveyancing",
  },
  {
    id: "landlords",
    label: "Landlord services",
    subject: "Landlords",
  },
  {
    id: "lettings",
    label: "Lettings / renting",
    subject: "Lettings",
  },
  {
    id: "mortgage",
    label: "Mortgages",
    subject: "Mortgage",
  },
  {
    id: "removals",
    label: "Removal services",
    subject: "Removals",
  },
  {
    id: "repairs",
    label: "Repairs / maintenance",
    subject: "Repairs",
  },
  {
    id: "sales",
    label: "Selling a property",
    subject: "Sales",
  },
  {
    id: "stamp-duty",
    label: "Stamp duty advice",
    subject: "Stamp duty",
  },
  {
    id: "valuation",
    label: "Valuation",
    subject: "Valuation",
  },
];

const reasonIds = new Set(contactReasons.map((item) => item.id));

export function isContactReasonId(value: string): boolean {
  return reasonIds.has(value);
}

export function getContactReason(id: string | null | undefined): ContactReason {
  const match = contactReasons.find((item) => item.id === id);
  return match ?? contactReasons[0]!;
}

/** Build /contact?reason=… links from elsewhere on the site. */
export function contactHref(reasonId = "general"): string {
  const id = isContactReasonId(reasonId) ? reasonId : "general";
  return id === "general" ? "/contact?reason=general" : `/contact?reason=${id}`;
}
