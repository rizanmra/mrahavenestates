export type PropertyType = "sale" | "rent";

export type Property = {
  slug: string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  type: PropertyType;
  status: "For Sale" | "For Rent" | "Sold" | "Let Agreed";
  summary: string;
  image: string;
};

export const properties: Property[] = [
  {
    slug: "modern-villa-bradford",
    title: "Modern Villa",
    location: "Bradford, BD8",
    price: "£485,000",
    beds: 5,
    baths: 4,
    area: "2,400 sq ft",
    type: "sale",
    status: "For Sale",
    summary:
      "A striking contemporary home with floor-to-ceiling glazing, landscaped gardens, and open-plan living across two levels.",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=85",
  },
  {
    slug: "cedar-court-family-home",
    title: "Cedar Court Family Home",
    location: "Shipley, BD18",
    price: "£325,000",
    beds: 4,
    baths: 3,
    area: "1,850 sq ft",
    type: "sale",
    status: "For Sale",
    summary:
      "Detached family residence with a south-facing garden, modern kitchen, and two reception rooms in a quiet cul-de-sac.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=85",
  },
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
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=85",
  },
  {
    slug: "victorian-terrace",
    title: "Victorian Terrace",
    location: "Keighley, BD21",
    price: "£195,000",
    beds: 3,
    baths: 1,
    area: "1,100 sq ft",
    type: "sale",
    status: "For Sale",
    summary:
      "Character-filled terrace with original features, a renovated kitchen, and walking distance to the town centre.",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=85",
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
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=85",
  },
  {
    slug: "detached-bungalow",
    title: "Detached Bungalow",
    location: "Bingley, BD16",
    price: "£275,000",
    beds: 3,
    baths: 2,
    area: "1,400 sq ft",
    type: "sale",
    status: "For Sale",
    summary:
      "Single-level living with a wraparound garden, double garage, and scope to extend subject to planning.",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=85",
  },
];

export function getProperty(slug: string): Property | undefined {
  return properties.find((property) => property.slug === slug);
}

export function getPropertiesByType(type?: PropertyType): Property[] {
  if (!type) return properties;
  return properties.filter((property) => property.type === type);
}
