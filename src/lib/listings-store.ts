import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  seedProperties,
  sortPropertiesNewestFirst,
  slugifyTitle,
  type Property,
  type PropertyStatus,
  type PropertyType,
} from "@/data/properties";

const FILE_PATH = path.join(process.cwd(), ".data", "listings.json");

let cache: Property[] | null = null;

function isProperty(value: unknown): value is Property {
  if (!value || typeof value !== "object") return false;
  const item = value as Property;
  return (
    typeof item.slug === "string" &&
    typeof item.title === "string" &&
    typeof item.location === "string" &&
    typeof item.price === "string" &&
    typeof item.beds === "number" &&
    typeof item.baths === "number" &&
    typeof item.area === "string" &&
    (item.type === "sale" || item.type === "rent") &&
    typeof item.status === "string" &&
    typeof item.summary === "string" &&
    typeof item.image === "string"
  );
}

function normalize(list: Property[]): Property[] {
  return sortPropertiesNewestFirst(
    list.map((item) => ({
      ...item,
      createdAt: item.createdAt || Date.now(),
    })),
  );
}

async function readFileStore(): Promise<Property[] | null> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const list = parsed.filter(isProperty);
    return list.length ? normalize(list) : null;
  } catch {
    return null;
  }
}

async function writeFileStore(list: Property[]) {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  const next = normalize(list);
  cache = next;
  await writeFile(FILE_PATH, JSON.stringify(next, null, 2), "utf8");
}

export async function listProperties(): Promise<Property[]> {
  if (cache) return cache;
  const fromFile = await readFileStore();
  if (fromFile) {
    cache = fromFile;
    return cache;
  }
  cache = normalize(seedProperties);
  await writeFileStore(cache);
  return cache;
}

export async function getPropertyBySlug(
  slug: string,
): Promise<Property | undefined> {
  const list = await listProperties();
  return list.find((item) => item.slug === slug);
}

export async function getPropertiesByType(
  type?: PropertyType,
): Promise<Property[]> {
  const list = await listProperties();
  if (!type) return list;
  return list.filter((item) => item.type === type);
}

export async function filterLiveSlugs(slugs: string[]): Promise<string[]> {
  const list = await listProperties();
  const set = new Set(list.map((item) => item.slug));
  return slugs.filter((slug) => set.has(slug));
}

export type PropertyInput = {
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  type?: PropertyType;
  status?: PropertyStatus;
  summary: string;
  image: string;
  slug?: string;
};

function uniqueSlug(base: string, existing: Property[], ignore?: string) {
  let slug = base || `property-${Date.now()}`;
  let n = 2;
  while (existing.some((item) => item.slug === slug && item.slug !== ignore)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  const list = await listProperties();
  const base = slugifyTitle(input.slug || input.title);
  const property: Property = {
    slug: uniqueSlug(base, list),
    title: input.title.trim(),
    location: input.location.trim(),
    price: input.price.trim(),
    beds: Number(input.beds) || 0,
    baths: Number(input.baths) || 0,
    area: input.area.trim(),
    type: input.type === "sale" ? "sale" : "rent",
    status:
      input.status ||
      (input.type === "sale" ? "For Sale" : "For Rent"),
    summary: input.summary.trim(),
    image: input.image.trim(),
    createdAt: Date.now(),
  };
  await writeFileStore([property, ...list]);
  return property;
}

export async function updateProperty(
  slug: string,
  input: Partial<PropertyInput> & { createdAt?: number },
): Promise<{ property: Property; previousSlug: string | null } | null> {
  const list = await listProperties();
  const index = list.findIndex((item) => item.slug === slug);
  if (index < 0) return null;
  const current = list[index]!;
  const nextSlug = input.slug
    ? uniqueSlug(slugifyTitle(input.slug), list, slug)
    : current.slug;
  const updated: Property = {
    ...current,
    title: input.title?.trim() ?? current.title,
    location: input.location?.trim() ?? current.location,
    price: input.price?.trim() ?? current.price,
    beds: input.beds !== undefined ? Number(input.beds) || 0 : current.beds,
    baths: input.baths !== undefined ? Number(input.baths) || 0 : current.baths,
    area: input.area?.trim() ?? current.area,
    type: input.type === "sale" || input.type === "rent" ? input.type : current.type,
    status: input.status ?? current.status,
    summary: input.summary?.trim() ?? current.summary,
    image: input.image?.trim() ?? current.image,
    slug: nextSlug,
    createdAt: input.createdAt ?? current.createdAt,
  };
  const next = [...list];
  next[index] = updated;
  await writeFileStore(next);
  return { property: updated, previousSlug: slug !== nextSlug ? slug : null };
}

export async function deleteProperty(
  slug: string,
): Promise<{ removed: boolean }> {
  const list = await listProperties();
  const next = list.filter((item) => item.slug !== slug);
  if (next.length === list.length) return { removed: false };
  await writeFileStore(next);
  return { removed: true };
}

export function invalidateListingsCache() {
  cache = null;
}
