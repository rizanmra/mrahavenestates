import { imageLibrary } from "@/data/hero-images";

export type PropertyType = "sale" | "rent";

export type PropertyStatus = "For Sale" | "For Rent" | "Sold" | "Let Agreed";

export type Property = {
  slug: string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  type: PropertyType;
  status: PropertyStatus;
  summary: string;
  image: string;
  /** Milliseconds since epoch — newer listings sort first. */
  createdAt: number;
};

/** Seed catalogue used when the local listings store is empty. Rent-only for public clients. */
export const seedProperties: Property[] = [
  {
    slug: "city-centre-apartment",
    title: "City Centre Apartment",
    location: "Bradford, BD1",
    price: "£950 pcm",
    beds: 2,
    baths: 2,
    area: "850 sq ft",
    type: "rent",
    status: "For Rent",
    summary:
      "Luxury apartment with balcony views, allocated parking, and concierge access in the heart of the city.",
    image: imageLibrary.heroPenthouse,
    createdAt: Date.UTC(2026, 8, 10),
  },
  {
    slug: "executive-flat",
    title: "Executive Flat",
    location: "Leeds, LS1",
    price: "£1,400 pcm",
    beds: 3,
    baths: 2,
    area: "1,200 sq ft",
    type: "rent",
    status: "For Rent",
    summary:
      "High-specification apartment with river views, underfloor heating, and secure underground parking.",
    image: imageLibrary.pageLettings,
    createdAt: Date.UTC(2026, 8, 8),
  },
  {
    slug: "modern-villa-bradford",
    title: "Modern Villa",
    location: "Bradford, BD8",
    price: "£2,450 pcm",
    beds: 5,
    baths: 4,
    area: "2,400 sq ft",
    type: "rent",
    status: "For Rent",
    summary:
      "A striking contemporary home with floor-to-ceiling glazing, landscaped gardens, and open-plan living across two levels.",
    image: imageLibrary.heroExterior,
    createdAt: Date.UTC(2026, 8, 6),
  },
  {
    slug: "cedar-court-family-home",
    title: "Cedar Court Family Home",
    location: "Shipley, BD18",
    price: "£1,650 pcm",
    beds: 4,
    baths: 3,
    area: "1,850 sq ft",
    type: "rent",
    status: "For Rent",
    summary:
      "Detached family residence with a south-facing garden, modern kitchen, and two reception rooms in a quiet cul-de-sac.",
    image: imageLibrary.heroInterior,
    createdAt: Date.UTC(2026, 8, 4),
  },
  {
    slug: "victorian-terrace",
    title: "Victorian Terrace",
    location: "Keighley, BD21",
    price: "£895 pcm",
    beds: 3,
    baths: 1,
    area: "1,100 sq ft",
    type: "rent",
    status: "For Rent",
    summary:
      "Character-filled terrace with original features, a renovated kitchen, and walking distance to the town centre.",
    image: imageLibrary.pageSales,
    createdAt: Date.UTC(2026, 8, 2),
  },
  {
    slug: "detached-bungalow",
    title: "Detached Bungalow",
    location: "Bingley, BD16",
    price: "£1,200 pcm",
    beds: 3,
    baths: 2,
    area: "1,400 sq ft",
    type: "rent",
    status: "For Rent",
    summary:
      "Single-level living with a wraparound garden, double garage, and scope to extend subject to planning.",
    image: imageLibrary.heroAerial,
    createdAt: Date.UTC(2026, 8, 1),
  },
];

/** @deprecated Prefer listProperties() from listings-store — kept for gradual migration. */
export const properties: Property[] = seedProperties;

export function sortPropertiesNewestFirst(list: Property[]): Property[] {
  return [...list].sort((a, b) => {
    const diff = (b.createdAt || 0) - (a.createdAt || 0);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title, "en-GB");
  });
}

export function getProperty(slug: string): Property | undefined {
  return seedProperties.find((property) => property.slug === slug);
}

export function filterAvailablePropertySlugs(slugs: string[]): string[] {
  return slugs.filter((slug) => Boolean(getProperty(slug)));
}

export function getPropertiesByType(type?: PropertyType): Property[] {
  const list = sortPropertiesNewestFirst(seedProperties);
  if (!type) return list;
  return list.filter((property) => property.type === type);
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
