export type PropertyTypeEstimate =
  | "detached"
  | "semi"
  | "terrace"
  | "flat"
  | "bungalow";

export type PropertyCondition = "needs-work" | "average" | "good" | "excellent";

/** Indicative UK outcode baselines (guide only). */
const postcodeBase: Record<string, number> = {
  BD1: 195_000,
  BD2: 185_000,
  BD3: 175_000,
  BD4: 168_000,
  BD5: 172_000,
  BD6: 210_000,
  BD7: 160_000,
  BD8: 178_000,
  BD9: 225_000,
  BD10: 240_000,
  BD11: 155_000,
  BD12: 148_000,
  BD13: 265_000,
  BD14: 190_000,
  BD15: 205_000,
  BD16: 235_000,
  BD17: 198_000,
  BD18: 228_000,
  BD19: 182_000,
  BD20: 175_000,
  BD21: 165_000,
  BD22: 310_000,
  LS1: 285_000,
  LS28: 245_000,
  LS29: 320_000,
  HX1: 155_000,
  HX2: 175_000,
  HX3: 210_000,
  HD1: 145_000,
  HD2: 165_000,
  WF1: 180_000,
  WF2: 195_000,
};

/** Applied to a typical 3-bed terrace baseline — keep these modest so they do not stack wildly. */
const typeMultiplier: Record<PropertyTypeEstimate, number> = {
  detached: 1.22,
  semi: 1.08,
  terrace: 1,
  flat: 0.84,
  bungalow: 1.05,
};

const conditionMultiplier: Record<PropertyCondition, number> = {
  "needs-work": 0.94,
  average: 1,
  good: 1.03,
  excellent: 1.06,
};

function extractOutcode(postcode: string): string {
  const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, " ");
  if (cleaned.includes(" ")) {
    return cleaned.split(" ")[0] ?? "";
  }
  // Prefer outward code from a full compacted postcode (last 3 = inward).
  const compact = cleaned.replace(/[^A-Z0-9]/g, "");
  if (compact.length >= 5) {
    return compact.slice(0, -3);
  }
  const match = cleaned.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
  return match?.[1] ?? "";
}

function bedsMultiplier(beds: number): number {
  if (beds <= 1) return 0.82;
  if (beds === 2) return 0.92;
  if (beds === 3) return 1;
  if (beds === 4) return 1.1;
  if (beds === 5) return 1.18;
  return 1.24;
}

function outdoorMultiplier(hasGarden: boolean, parking: boolean): number {
  let m = 1;
  if (hasGarden) m += 0.015;
  if (parking) m += 0.01;
  return m;
}

export type MarketEstimate = {
  low: number;
  mid: number;
  high: number;
  area: string;
  confidence: "local" | "regional";
  source?: "sold-prices" | "guide";
  salesCount?: number;
};

export function estimateMarketValue(input: {
  postcode: string;
  propertyType: PropertyTypeEstimate;
  bedrooms: number;
  condition?: PropertyCondition;
  hasGarden?: boolean;
  hasParking?: boolean;
}): MarketEstimate | null {
  const outcode = extractOutcode(input.postcode);
  if (!outcode || input.bedrooms < 1) return null;

  const known = Object.prototype.hasOwnProperty.call(postcodeBase, outcode);
  const base = postcodeBase[outcode] ?? 185_000;
  const condition = input.condition ?? "average";

  const mid = Math.round(
    base *
      typeMultiplier[input.propertyType] *
      bedsMultiplier(input.bedrooms) *
      conditionMultiplier[condition] *
      outdoorMultiplier(Boolean(input.hasGarden), Boolean(input.hasParking)),
  );

  const spread = Math.round(mid * (known ? 0.05 : 0.08));

  return {
    low: mid - spread,
    mid,
    high: mid + spread,
    area: outcode,
    confidence: known ? "local" : "regional",
    source: "guide",
  };
}

export function formatGbp(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export const propertyTypeLabels: Record<PropertyTypeEstimate, string> = {
  detached: "Detached",
  semi: "Semi-detached",
  terrace: "Terraced",
  flat: "Flat / apartment",
  bungalow: "Bungalow",
};

export const conditionLabels: Record<PropertyCondition, string> = {
  "needs-work": "Needs work",
  average: "Average",
  good: "Good",
  excellent: "Excellent",
};
