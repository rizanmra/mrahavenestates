import type { PortalEnquiry } from "@/lib/portal";
import type { PropertyEnquiryRecord } from "@/lib/property-enquiry";

export function inboxToPortalEnquiry(
  record: PropertyEnquiryRecord,
  userId: string,
): PortalEnquiry {
  const slug = record.property.slug || "";
  const isValuation = slug.includes("valuation") || slug.includes("contact-valuation");
  const isContact =
    record.property.type === "contact" || slug.startsWith("contact-");
  const type: PortalEnquiry["type"] = isValuation
    ? "valuation"
    : isContact
      ? "contact"
      : "property";

  return {
    id: record.id,
    type,
    summary: `${record.property.title} — ${record.message}`,
    createdAt: record.createdAt,
    ownerUserId: userId,
    ownerEmail: record.email.trim().toLowerCase(),
    status: record.status === "answered" ? "answered" : "open",
    reply: record.reply,
    repliedAt: record.repliedAt,
    sourceEnquiryId: record.id,
  };
}

export function mergePortalEnquiryLists(
  ...lists: PortalEnquiry[][]
): PortalEnquiry[] {
  const map = new Map<string, PortalEnquiry>();
  for (const list of lists) {
    for (const item of list) {
      const key = item.sourceEnquiryId || item.id;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, item);
        continue;
      }
      const prevScore = (prev.repliedAt ?? 0) + (prev.reply ? 1 : 0);
      const nextScore = (item.repliedAt ?? 0) + (item.reply ? 1 : 0);
      map.set(
        key,
        nextScore >= prevScore
          ? {
              ...prev,
              ...item,
              id: prev.id,
              sourceEnquiryId: prev.sourceEnquiryId || item.sourceEnquiryId,
            }
          : prev,
      );
    }
  }
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}
