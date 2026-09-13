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
