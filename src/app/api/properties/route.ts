import { NextResponse } from "next/server";
import {
  getPropertiesBySlugs,
  getPropertiesByType,
  listProperties,
  type PropertyType,
} from "@/lib/listings-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const location = searchParams.get("location")?.trim().toLowerCase() || "";
  const slugsParam = searchParams.get("slugs")?.trim() || "";
  const type =
    typeParam === "sale" || typeParam === "rent"
      ? (typeParam as PropertyType)
      : undefined;

  // Saved shortlist / account: resolve specific slugs from Firestore first.
  if (slugsParam) {
    const slugs = slugsParam
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean);
    const properties = await getPropertiesBySlugs(slugs);
    return NextResponse.json({ ok: true, properties });
  }

  let properties = type
    ? await getPropertiesByType(type)
    : await listProperties();

  if (location) {
    properties = properties.filter(
      (property) =>
        property.location.toLowerCase().includes(location) ||
        property.title.toLowerCase().includes(location) ||
        property.slug.toLowerCase().includes(location.replace(/\s+/g, "-")),
    );
  }

  return NextResponse.json({ ok: true, properties });
}
