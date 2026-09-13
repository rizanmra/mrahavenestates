import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-server";
import {
  createProperty,
  deleteProperty,
  listProperties,
  updateProperty,
} from "@/lib/listings-store";
import type { PropertyInput } from "@/lib/listings-store";
import { purgePropertyFromAllUsers } from "@/lib/purge-property-saves";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const properties = await listProperties();
  return NextResponse.json({ ok: true, properties });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Partial<PropertyInput>;
  if (!body.title?.trim() || !body.location?.trim() || !body.price?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Title, location and price are required." },
      { status: 400 },
    );
  }
  if (!body.summary?.trim() || !body.image?.trim() || !body.area?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Summary, image and area are required." },
      { status: 400 },
    );
  }

  const property = await createProperty({
    title: body.title,
    location: body.location,
    price: body.price,
    beds: Number(body.beds) || 0,
    baths: Number(body.baths) || 1,
    area: body.area,
    type: "rent",
    status: "For Rent",
    summary: body.summary,
    image: body.image,
    slug: body.slug,
  });

  return NextResponse.json({ ok: true, property });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Partial<PropertyInput> & { slug?: string };
  const slug = String(body.slug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Missing property slug." }, { status: 400 });
  }

  const result = await updateProperty(slug, {
    ...body,
    type: "rent",
    status: "For Rent",
  });
  if (!result) {
    return NextResponse.json({ ok: false, error: "Property not found." }, { status: 404 });
  }
  if (result.previousSlug) {
    await purgePropertyFromAllUsers(result.previousSlug).catch(() => 0);
  }
  return NextResponse.json({ ok: true, property: result.property });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim() || "";
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Missing property slug." }, { status: 400 });
  }

  const result = await deleteProperty(slug);
  if (!result.removed) {
    return NextResponse.json({ ok: false, error: "Property not found." }, { status: 404 });
  }
  await purgePropertyFromAllUsers(slug).catch(() => 0);
  return NextResponse.json({ ok: true });
}
