import { NextResponse } from "next/server";
import { estimateByFloorArea } from "@/lib/land-registry";

export const runtime = "nodejs";

const PROPERTY_TYPES = new Set([
  "detached",
  "semi",
  "terrace",
  "flat",
  "bungalow",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      postcode?: string;
      propertyType?: string;
      floorAreaSqFt?: number | string;
    };

    const postcode = body.postcode?.trim() ?? "";
    const propertyType = (body.propertyType?.trim() || "other").toLowerCase();
    const floorAreaSqFt = Number(
      typeof body.floorAreaSqFt === "string"
        ? body.floorAreaSqFt.replace(/,/g, "")
        : body.floorAreaSqFt,
    );

    if (!postcode) {
      return NextResponse.json(
        { ok: false, error: "Please enter a UK postcode." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(floorAreaSqFt) || floorAreaSqFt < 200 || floorAreaSqFt > 20000) {
      return NextResponse.json(
        {
          ok: false,
          error: "Enter a realistic floor area in square feet (e.g. 850–3,000).",
        },
        { status: 400 },
      );
    }

    const type = PROPERTY_TYPES.has(propertyType) ? propertyType : "other";
    const estimate = await estimateByFloorArea({
      postcode,
      propertyType: type,
      floorAreaSqFt,
    });

    if (!estimate) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Not enough recent Land Registry sales near that postcode. Try a neighbouring England & Wales postcode.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, estimate });
  } catch (error) {
    console.error("[property-value-estimate]", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong talking to Land Registry. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}
