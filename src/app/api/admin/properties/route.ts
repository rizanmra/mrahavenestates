import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-server";
import {
  createProperty,
  deleteProperty,
  listProperties,
  seedAllListings,
  updateProperty,
} from "@/lib/listings-store";
import type { PropertyInput } from "@/lib/listings-store";
import { purgePropertyFromAllUsers, renamePropertyInAllUsers } from "@/lib/purge-property-saves";
import type { PropertyStatus, PropertyType } from "@/data/properties";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function listingKind(value: unknown): {
  type: PropertyType;
  status: PropertyStatus;
} | null {
  if (value === "sale") return { type: "sale", status: "For Sale" };
  if (value === "rent") return { type: "rent", status: "For Rent" };
  return null;
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  let properties = await listProperties();
  if (properties.length === 0) {
    properties = await seedAllListings();
  }
  return NextResponse.json({ ok: true, properties });
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Partial<PropertyInput> & {
    seed?: boolean;
  };

  if (body.seed === true) {
    const properties = await seedAllListings();
    return NextResponse.json({ ok: true, properties, seeded: properties.length });
  }

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

  const kind = listingKind(body.type);
  if (!kind) {
    return NextResponse.json(
      { ok: false, error: "Please choose whether this listing is for sale or to rent." },
      { status: 400 },
    );
  }

  const propertyResult = await createProperty(
    {
      title: body.title,
      location: body.location,
      price: body.price,
      beds: Number(body.beds) || 0,
      baths: Number(body.baths) || 1,
      area: body.area,
      type: kind.type,
      status: kind.status,
      summary: body.summary,
      image: body.image,
      slug: body.slug,
    },
    auth.idToken,
  );

  return NextResponse.json({
    ok: true,
    property: propertyResult.property,
    firestore: propertyResult.firestore,
    warning: propertyResult.firestore
      ? undefined
      : "Listing saved locally, but Firestore sync failed. Check properties rules and staff credentials.",
  });
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

  const kind = listingKind(body.type);
  const result = await updateProperty(
    slug,
    {
      ...body,
      ...(kind
        ? { type: kind.type, status: kind.status }
        : { type: undefined, status: undefined }),
    },
    auth.idToken,
  );
  if (!result) {
    return NextResponse.json({ ok: false, error: "Property not found." }, { status: 404 });
  }
  if (result.previousSlug) {
    await renamePropertyInAllUsers(
      result.previousSlug,
      result.property.slug,
    ).catch(() => 0);
  }
  return NextResponse.json({
    ok: true,
    property: result.property,
    firestore: result.firestore,
    warning: result.firestore
      ? undefined
      : "Listing updated locally, but Firestore sync failed. Check properties rules and staff credentials.",
  });
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

  const result = await deleteProperty(slug, auth.idToken);
  if (!result.removed) {
    return NextResponse.json({ ok: false, error: "Property not found." }, { status: 404 });
  }
  await purgePropertyFromAllUsers(slug).catch(() => 0);
  return NextResponse.json({
    ok: true,
    firestore: result.firestore,
    warning: result.firestore
      ? undefined
      : "Listing removed locally, but Firestore delete failed. Check properties rules and staff credentials.",
  });
}
