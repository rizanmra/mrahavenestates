import { NextResponse } from "next/server";
import { estimateFromPostcodeSales } from "@/lib/land-registry";
import {
  estimateMarketValue,
  type PropertyCondition,
  type PropertyTypeEstimate,
} from "@/lib/market-estimate";

export const runtime = "nodejs";

const types = new Set([
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
      bedrooms?: number;
      condition?: string;
      hasGarden?: boolean;
      hasParking?: boolean;
    };

    const postcode = String(body.postcode ?? "").trim();
    const propertyType = String(body.propertyType ?? "semi");
    const bedrooms = Number(body.bedrooms) || 3;
    const condition = (body.condition ?? "average") as PropertyCondition;

    if (!postcode || !types.has(propertyType)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid UK postcode and property type." },
        { status: 400 },
      );
    }

    try {
      const sold = await estimateFromPostcodeSales({
        postcode,
        propertyType,
        condition,
      });
      if (sold) {
        return NextResponse.json({
          ok: true,
          estimate: {
            ...sold,
            confidence: "local",
            source: "sold-prices",
          },
        });
      }
    } catch (error) {
      console.warn("[valuation-estimate] land registry skipped", error);
    }

    const guide = estimateMarketValue({
      postcode,
      propertyType: propertyType as PropertyTypeEstimate,
      bedrooms,
      condition,
      hasGarden: Boolean(body.hasGarden),
      hasParking: Boolean(body.hasParking),
    });
    if (!guide) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid UK postcode and bedrooms." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      estimate: guide,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not estimate this property just now." },
      { status: 500 },
    );
  }
}
