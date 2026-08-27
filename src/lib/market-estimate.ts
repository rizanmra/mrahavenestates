export type PropertyTypeEstimate =
  | "detached"
  | "semi"
  | "terrace"
  | "flat"
  | "bungalow";

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
  LS29: 320_000,
};

const typeMultiplier: Record<PropertyTypeEstimate, number> = {
  detached: 1.35,
  semi: 1.15,
  terrace: 0.95,
  flat: 0.82,
  bungalow: 1.1,
};

function extractOutcode(postcode: string): string {
  const cleaned = postcode.trim().toUpperCase().replace(/\s+/g, " ");
  const match = cleaned.match(/^([A-Z]{1,2}\d{1,2})/);
  return match?.[1] ?? "";
}

function bedsMultiplier(beds: number): number {
  if (beds <= 1) return 0.78;
  if (beds === 2) return 0.9;
  if (beds === 3) return 1;
  if (beds === 4) return 1.18;
  if (beds === 5) return 1.32;
  return 1.45;
}

export type MarketEstimate = {
  low: number;
  mid: number;
  high: number;
  area: string;
};

export function estimateMarketValue(input: {
  postcode: string;
  propertyType: PropertyTypeEstimate;
  bedrooms: number;
}): MarketEstimate | null {
  const outcode = extractOutcode(input.postcode);
  if (!outcode || input.bedrooms < 1) return null;

  const base = postcodeBase[outcode] ?? 185_000;
  const mid = Math.round(
    base *
      typeMultiplier[input.propertyType] *
      bedsMultiplier(input.bedrooms),
  );

  const spread = Math.round(mid * 0.06);

  return {
    low: mid - spread,
    mid,
    high: mid + spread,
    area: outcode,
  };
}

export function formatGbp(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}
