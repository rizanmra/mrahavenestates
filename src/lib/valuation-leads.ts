export type ValuationLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  propertyType: string;
  bedrooms: number;
  estimateMid: number;
  estimateLow: number;
  estimateHigh: number;
  marketingOptIn: boolean;
  createdAt: number;
  source: "property-value-calculator";
};

const LEADS_KEY = "mra-valuation-leads";

function readLeads(): ValuationLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEADS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ValuationLead[];
  } catch {
    return [];
  }
}

/** Soft opt-in lead capture — works before Firebase is connected. */
export function saveValuationLead(
  lead: Omit<ValuationLead, "id" | "createdAt" | "source">,
): ValuationLead {
  const next: ValuationLead = {
    ...lead,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    source: "property-value-calculator",
  };
  const all = [next, ...readLeads()].slice(0, 50);
  window.localStorage.setItem(LEADS_KEY, JSON.stringify(all));
  return next;
}

export function getValuationLeads(): ValuationLead[] {
  return readLeads();
}
