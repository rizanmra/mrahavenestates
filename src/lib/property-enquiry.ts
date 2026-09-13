export type PropertyEnquiryListing = {
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

export type PropertyEnquiryRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  property: PropertyEnquiryListing;
  createdAt: number;
  read: boolean;
  status?: "open" | "answered";
  reply?: string;
  repliedAt?: number;
  repliedBy?: string;
};

export function isPropertyEnquiryRecord(
  value: unknown,
): value is PropertyEnquiryRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as PropertyEnquiryRecord;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.email === "string" &&
    typeof item.phone === "string" &&
    typeof item.message === "string" &&
    typeof item.createdAt === "number" &&
    typeof item.read === "boolean" &&
    Boolean(item.property) &&
    typeof item.property === "object" &&
    typeof item.property.slug === "string" &&
    typeof item.property.title === "string"
  );
}
