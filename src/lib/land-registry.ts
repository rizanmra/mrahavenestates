export type SoldTransaction = {
  paon: string;
  saon: string;
  street: string;
  town: string;
  postcode: string;
  amount: number;
  date: string;
  propertyType: string;
};

export type PropertyPriceResult = {
  matchedAddress: string;
  latest: SoldTransaction;
  history: SoldTransaction[];
};

const ENDPOINT = "https://landregistry.data.gov.uk/landregistry/query";

/** Normalise UK postcode to "XX0 0XX" form. */
export function normalisePostcode(input: string): string | null {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.length < 5 || compact.length > 7) return null;
  const outward = compact.slice(0, -3);
  const inward = compact.slice(-3);
  if (!/^[A-Z]{1,2}\d[A-Z\d]?$/.test(outward) || !/^\d[A-Z]{2}$/.test(inward)) {
    return null;
  }
  return `${outward} ${inward}`;
}

/** Pull a UK postcode out of free text if present. */
export function extractPostcode(text: string): string | null {
  const match = text.toUpperCase().match(
    /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/,
  );
  if (!match) return null;
  return normalisePostcode(match[1]);
}

function bindingValue(
  binding: Record<string, { value?: string } | undefined>,
  key: string,
): string {
  return binding[key]?.value?.trim() ?? "";
}

function parseBindings(
  bindings: Record<string, { value?: string }>[],
): SoldTransaction[] {
  return bindings
    .map((b) => ({
      paon: bindingValue(b, "paon"),
      saon: bindingValue(b, "saon"),
      street: bindingValue(b, "street"),
      town: bindingValue(b, "town"),
      postcode: bindingValue(b, "postcode"),
      amount: Number(bindingValue(b, "amount")) || 0,
      date: bindingValue(b, "date"),
      propertyType: bindingValue(b, "propertyType"),
    }))
    .filter((t) => t.amount > 0 && t.date);
}

function formatAddress(t: SoldTransaction): string {
  const parts = [t.saon, t.paon, t.street, t.town, t.postcode].filter(Boolean);
  return parts.join(", ");
}

function scoreMatch(t: SoldTransaction, query: string): number {
  const q = query.toUpperCase().replace(/[^A-Z0-9\s]/g, " ");
  const tokens = q.split(/\s+/).filter((tok) => tok.length > 1);
  const hay = `${t.paon} ${t.saon} ${t.street} ${t.town}`.toUpperCase();
  let score = 0;
  for (const token of tokens) {
    if (hay.includes(token)) score += token.length > 3 ? 3 : 2;
  }
  const house = q.match(/\b(\d+[A-Z]?)\b/);
  if (house) {
    const want = house[1];
    const paon = t.paon.toUpperCase().replace(/\s+/g, "");
    const saon = t.saon.toUpperCase().replace(/\s+/g, "");
    const paonNum = paon.match(/\d+[A-Z]?/)?.[0];
    const exact =
      paon === want ||
      paonNum === want ||
      saon.includes(want) ||
      new RegExp(`(^|\\D)${want}(\\D|$)`).test(paon);
    if (!exact) return -1;
    score += 20;
  }
  return score;
}

async function sparqlQuery(query: string): Promise<SoldTransaction[]> {
  const body = new URLSearchParams({ query });
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/sparql-results+json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`Land Registry request failed (${res.status})`);
  }

  const json = (await res.json()) as {
    results?: { bindings?: Record<string, { value?: string }>[] };
  };
  return parseBindings(json.results?.bindings ?? []);
}

function buildPostcodeQuery(postcode: string, limit = 200): string {
  return `
prefix xsd: <http://www.w3.org/2001/XMLSchema#>
prefix lrppi: <http://landregistry.data.gov.uk/def/ppi/>
prefix lrcommon: <http://landregistry.data.gov.uk/def/common/>
prefix skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?paon ?saon ?street ?town ?postcode ?amount ?date ?propertyType
WHERE {
  VALUES ?postcode {"${postcode}"^^xsd:string}
  ?addr lrcommon:postcode ?postcode .
  ?transx lrppi:propertyAddress ?addr ;
          lrppi:pricePaid ?amount ;
          lrppi:transactionDate ?date .
  OPTIONAL { ?addr lrcommon:paon ?paon }
  OPTIONAL { ?addr lrcommon:saon ?saon }
  OPTIONAL { ?addr lrcommon:street ?street }
  OPTIONAL { ?addr lrcommon:town ?town }
  OPTIONAL { ?transx lrppi:propertyType/skos:prefLabel ?propertyType }
}
ORDER BY DESC(?date)
LIMIT ${limit}
`.trim();
}

/**
 * Look up HM Land Registry sold prices for an England/Wales address.
 * Returns the best-matching property's latest sale + history.
 */
export async function lookupPropertyPrice(params: {
  address: string;
  postcode?: string;
}): Promise<PropertyPriceResult | null> {
  const address = params.address.trim();
  if (!address) return null;

  const postcode =
    normalisePostcode(params.postcode ?? "") ??
    extractPostcode(address) ??
    extractPostcode(`${address} ${params.postcode ?? ""}`);

  if (!postcode) return null;

  const sales = await sparqlQuery(buildPostcodeQuery(postcode));
  if (!sales.length) return null;

  // Group by property identity
  const groups = new Map<string, SoldTransaction[]>();
  for (const sale of sales) {
    const key = `${sale.paon}|${sale.saon}|${sale.street}|${sale.postcode}`.toUpperCase();
    const list = groups.get(key) ?? [];
    list.push(sale);
    groups.set(key, list);
  }

  let bestKey = "";
  let bestScore = -1;
  for (const [key, list] of groups) {
    const sample = list[0];
    const score = scoreMatch(sample, address);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  // Need a meaningful address match (not just postcode-only dump).
  // House-number mismatches score -1 and must be rejected.
  if (bestScore < 2) return null;

  const history = (groups.get(bestKey) ?? []).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const latest = history[0];
  if (!latest) return null;

  return {
    matchedAddress: formatAddress(latest),
    latest,
    history: history.slice(0, 8),
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const first = sorted[mid];
  const second = sorted[mid - 1];
  if (sorted.length % 2 === 0 && first != null && second != null) {
    return Math.round((first + second) / 2);
  }
  return first ?? 0;
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((sorted.length - 1) * p)),
  );
  return sorted[index] ?? 0;
}

function matchesPropertyType(lrType: string, want: string): boolean {
  const type = lrType.toLowerCase();
  switch (want) {
    case "detached":
      return type.includes("detached") && !type.includes("semi");
    case "semi":
      return type.includes("semi");
    case "terrace":
      return type.includes("terrace");
    case "flat":
      return type.includes("flat") || type.includes("maisonette");
    case "bungalow":
      return type.includes("bungalow");
    default:
      return true;
  }
}

function inflateToToday(amount: number, saleDate: string): number {
  const sold = Date.parse(saleDate);
  if (!Number.isFinite(sold)) return amount;
  const months = Math.max(0, (Date.now() - sold) / (1000 * 60 * 60 * 24 * 30.4));
  const factor = 1 + Math.min(0.12, months * 0.0025);
  return Math.round(amount * factor);
}

/**
 * Area estimate from HM Land Registry sold prices in the same postcode.
 * Uses the median of recent comparable sales instead of a made-up multiplier.
 */
export async function estimateFromPostcodeSales(params: {
  postcode: string;
  propertyType: string;
  condition?: string;
}): Promise<{
  low: number;
  mid: number;
  high: number;
  area: string;
  salesCount: number;
} | null> {
  const postcode = normalisePostcode(params.postcode);
  if (!postcode) return null;

  const sales = await sparqlQuery(buildPostcodeQuery(postcode, 250));
  if (sales.length < 3) return null;

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 4);
  const recent = sales.filter((sale) => Date.parse(sale.date) >= cutoff.getTime());
  const pool = recent.length >= 3 ? recent : sales;

  const typed = pool.filter((sale) =>
    matchesPropertyType(sale.propertyType, params.propertyType),
  );
  const comps = typed.length >= 3 ? typed : pool;
  const inflated = comps.map((sale) => inflateToToday(sale.amount, sale.date));
  if (inflated.length < 3) return null;

  let mid = median(inflated);
  const condition =
    params.condition === "needs-work"
      ? 0.96
      : params.condition === "excellent"
        ? 1.04
        : params.condition === "good"
          ? 1.02
          : 1;
  mid = Math.round(mid * condition);

  let low = percentile(inflated, 0.25);
  let high = percentile(inflated, 0.75);
  low = Math.round(low * condition);
  high = Math.round(high * condition);

  const maxSpread = Math.round(mid * 0.08);
  if (mid - low > maxSpread) low = mid - maxSpread;
  if (high - mid > maxSpread) high = mid + maxSpread;
  if (low >= mid) low = mid - Math.round(mid * 0.05);
  if (high <= mid) high = mid + Math.round(mid * 0.05);

  return {
    low,
    mid,
    high,
    area: postcode.split(" ")[0] || postcode,
    salesCount: inflated.length,
  };
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** 1 m² = 10.7639 sq ft */
export const SQ_FT_PER_M2 = 10.7639;

export function sqFtToM2(sqFt: number): number {
  return sqFt / SQ_FT_PER_M2;
}

export function m2ToSqFt(m2: number): number {
  return m2 * SQ_FT_PER_M2;
}

/**
 * Typical internal floor areas (m²) by property type.
 * Used when EPC floor area isn't available — Land Registry PPD has no size field.
 * Roughly aligned with English Housing Survey stock averages.
 */
const TYPICAL_FLOOR_M2: Record<string, number> = {
  detached: 149,
  semi: 95,
  terrace: 85,
  flat: 60,
  bungalow: 80,
  other: 90,
};

function typicalFloorM2(propertyType: string): number {
  return TYPICAL_FLOOR_M2[propertyType] ?? TYPICAL_FLOOR_M2.other ?? 90;
}

function floorKeyFromLrType(lrType: string): string {
  const type = lrType.toLowerCase();
  if (type.includes("semi")) return "semi";
  if (type.includes("detached")) return "detached";
  if (type.includes("terrace")) return "terrace";
  if (type.includes("flat") || type.includes("maisonette")) return "flat";
  if (type.includes("bungalow")) return "bungalow";
  return "other";
}

function buildDistrictQuery(outward: string, limit = 250): string {
  const prefix = outward.replace(/"/g, "").toUpperCase();
  return `
prefix xsd: <http://www.w3.org/2001/XMLSchema#>
prefix lrppi: <http://landregistry.data.gov.uk/def/ppi/>
prefix lrcommon: <http://landregistry.data.gov.uk/def/common/>
prefix skos: <http://www.w3.org/2004/02/skos/core#>
SELECT ?paon ?saon ?street ?town ?postcode ?amount ?date ?propertyType
WHERE {
  ?addr lrcommon:postcode ?postcode .
  FILTER(STRSTARTS(?postcode, "${prefix} "))
  ?transx lrppi:propertyAddress ?addr ;
          lrppi:pricePaid ?amount ;
          lrppi:transactionDate ?date .
  OPTIONAL { ?addr lrcommon:paon ?paon }
  OPTIONAL { ?addr lrcommon:saon ?saon }
  OPTIONAL { ?addr lrcommon:street ?street }
  OPTIONAL { ?addr lrcommon:town ?town }
  OPTIONAL { ?transx lrppi:propertyType/skos:prefLabel ?propertyType }
}
ORDER BY DESC(?date)
LIMIT ${limit}
`.trim();
}

type EpcFloorRow = {
  address: string;
  postcode: string;
  floorAreaM2: number;
  propertyType: string;
};

/** Optional Domestic EPC open-data lookup (needs EPC_API_EMAIL + EPC_API_KEY). */
async function fetchEpcFloorAreas(postcode: string): Promise<EpcFloorRow[]> {
  const email = process.env.EPC_API_EMAIL?.trim();
  const key = process.env.EPC_API_KEY?.trim();
  if (!email || !key) return [];

  const auth = Buffer.from(`${email}:${key}`).toString("base64");
  const url = new URL(
    "https://epc.opendatacommunities.org/api/v1/domestic/search",
  );
  url.searchParams.set("postcode", postcode);
  url.searchParams.set("size", "100");

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];

    const json = (await res.json()) as {
      rows?: Array<Record<string, string | number | undefined>>;
    };
    return (json.rows ?? [])
      .map((row) => {
        const floor = Number(
          row["total-floor-area"] ?? row.total_floor_area ?? 0,
        );
        if (!Number.isFinite(floor) || floor < 20 || floor > 600) return null;
        return {
          address: String(row.address ?? row["address1"] ?? ""),
          postcode: String(row.postcode ?? postcode),
          floorAreaM2: floor,
          propertyType: String(
            row["property-type"] ?? row.property_type ?? "",
          ),
        } satisfies EpcFloorRow;
      })
      .filter((row): row is EpcFloorRow => Boolean(row));
  } catch {
    return [];
  }
}

function matchEpcFloor(
  sale: SoldTransaction,
  epcs: EpcFloorRow[],
): number | null {
  if (!epcs.length) return null;
  const paon = sale.paon.toUpperCase().replace(/\s+/g, "");
  const street = sale.street.toUpperCase();
  let best: EpcFloorRow | null = null;
  let bestScore = 0;
  for (const epc of epcs) {
    const addr = epc.address.toUpperCase().replace(/\s+/g, " ");
    let score = 0;
    if (paon && addr.replace(/\s+/g, "").includes(paon)) score += 5;
    if (street && addr.includes(street)) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = epc;
    }
  }
  if (!best || bestScore < 5) return null;
  return best.floorAreaM2;
}

export type FloorAreaEstimate = {
  low: number;
  mid: number;
  high: number;
  pricePerSqM: number;
  pricePerSqFt: number;
  floorAreaSqFt: number;
  floorAreaM2: number;
  area: string;
  salesCount: number;
  method: "epc" | "typical-size";
  attribution: string;
};

/**
 * Local estimate from HM Land Registry sold prices → £/m² × user floor area.
 * Floor areas for comps come from Domestic EPC open data when configured,
 * otherwise from typical sizes for the selected property type.
 */
export async function estimateByFloorArea(params: {
  postcode: string;
  propertyType: string;
  floorAreaSqFt: number;
}): Promise<FloorAreaEstimate | null> {
  const postcode = normalisePostcode(params.postcode);
  const floorAreaSqFt = Number(params.floorAreaSqFt);
  if (!postcode || !Number.isFinite(floorAreaSqFt) || floorAreaSqFt < 200) {
    return null;
  }

  const floorAreaM2 = sqFtToM2(floorAreaSqFt);
  let sales = await sparqlQuery(buildPostcodeQuery(postcode, 250));
  let areaLabel = postcode;

  if (sales.length < 5) {
    const outward = postcode.split(" ")[0];
    if (outward) {
      const district = await sparqlQuery(buildDistrictQuery(outward, 250));
      if (district.length > sales.length) {
        sales = district;
        areaLabel = `${outward} area`;
      }
    }
  }

  if (sales.length < 3) return null;

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 5);
  const recent = sales.filter(
    (sale) => Date.parse(sale.date) >= cutoff.getTime(),
  );
  const pool = recent.length >= 3 ? recent : sales;
  const typed = pool.filter((sale) =>
    matchesPropertyType(sale.propertyType, params.propertyType),
  );
  const comps = typed.length >= 3 ? typed : pool;

  const epcs = await fetchEpcFloorAreas(postcode);
  let epcHits = 0;
  const rates: number[] = [];

  for (const sale of comps) {
    const inflated = inflateToToday(sale.amount, sale.date);
    const epcM2 = matchEpcFloor(sale, epcs);
    const floorM2 =
      epcM2 ??
      typicalFloorM2(
        matchesPropertyType(sale.propertyType, params.propertyType)
          ? params.propertyType
          : floorKeyFromLrType(sale.propertyType),
      );
    if (epcM2) epcHits += 1;
    if (floorM2 <= 0) continue;
    const rate = inflated / floorM2;
    if (rate > 500 && rate < 50_000) rates.push(rate);
  }

  if (rates.length < 3) return null;

  const pricePerSqM = median(rates);
  const mid = Math.round(pricePerSqM * floorAreaM2);
  const lowRate = percentile(rates, 0.25);
  const highRate = percentile(rates, 0.75);
  let low = Math.round(lowRate * floorAreaM2);
  let high = Math.round(highRate * floorAreaM2);

  const maxSpread = Math.round(mid * 0.12);
  if (mid - low > maxSpread) low = mid - maxSpread;
  if (high - mid > maxSpread) high = mid + maxSpread;
  if (low >= mid) low = mid - Math.round(mid * 0.06);
  if (high <= mid) high = mid + Math.round(mid * 0.06);

  const method = epcHits >= 3 ? "epc" : "typical-size";

  return {
    low,
    mid,
    high,
    pricePerSqM: Math.round(pricePerSqM),
    pricePerSqFt: Math.round(pricePerSqM / SQ_FT_PER_M2),
    floorAreaSqFt: Math.round(floorAreaSqFt),
    floorAreaM2: Math.round(floorAreaM2 * 10) / 10,
    area: areaLabel,
    salesCount: rates.length,
    method,
    attribution:
      "Contains HM Land Registry data (Crown copyright and database right 2026). This information is licensed under the Open Government Licence v3.0.",
  };
}
