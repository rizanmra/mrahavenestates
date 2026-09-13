import { NextResponse } from "next/server";
import { lookupPropertyPrice } from "@/lib/land-registry";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      address?: string;
      postcode?: string;
    };

    const address = body.address?.trim() ?? "";
    const postcode = body.postcode?.trim() ?? "";

    if (!address) {
      return NextResponse.json(
        { error: "Please enter a property address." },
        { status: 400 },
      );
    }

    const result = await lookupPropertyPrice({ address, postcode });

    if (!result) {
      return NextResponse.json(
        {
          found: false,
          error:
            "We couldn’t find a sold-price record for that address. Check the house number, street and postcode, or try a nearby full UK postcode (England & Wales only).",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      found: true,
      matchedAddress: result.matchedAddress,
      latest: result.latest,
      history: result.history,
      attribution:
        "Contains HM Land Registry data (Crown copyright and database right 2026). This information is licensed under the Open Government Licence v3.0.",
    });
  } catch (error) {
    console.error("[property-price]", error);
    return NextResponse.json(
      {
        found: false,
        error:
          "Something went wrong looking up Land Registry data. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}
