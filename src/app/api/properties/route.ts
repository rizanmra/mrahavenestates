import { NextResponse } from "next/server";
import {
  getPropertiesByType as getSeedByType,
  seedProperties,
  type PropertyType,
} from "@/data/properties";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const location = searchParams.get("location")?.trim().toLowerCase() || "";
  const type =
    typeParam === "sale" || typeParam === "rent"
      ? (typeParam as PropertyType)
      : undefined;

  let properties = type ? getSeedByType(type) : seedProperties;

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
