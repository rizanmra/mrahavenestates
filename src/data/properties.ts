export type Property = {
  slug: string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  area: string;
  status: "For Sale" | "For Rent" | "Sold";
  summary: string;
};

export const properties: Property[] = [
  {
    slug: "haven-ridge-villa",
    title: "Haven Ridge Villa",
    location: "Hillside Estate",
    price: "PKR 4.85 Cr",
    beds: 5,
    baths: 6,
    area: "1.2 Kanal",
    status: "For Sale",
    summary:
      "A private family villa with landscaped gardens, a double-height lounge, and evening terrace views.",
  },
  {
    slug: "cedar-court-residence",
    title: "Cedar Court Residence",
    location: "Cedar Court",
    price: "PKR 2.40 Cr",
    beds: 4,
    baths: 4,
    area: "10 Marla",
    status: "For Sale",
    summary:
      "A quiet courtyard home with a chef’s kitchen, study, and a sunlit family room opening onto the garden.",
  },
  {
    slug: "lakeview-apartments",
    title: "Lakeview Apartments",
    location: "Waterfront",
    price: "PKR 1.15 Cr",
    beds: 3,
    baths: 3,
    area: "1,850 sq ft",
    status: "For Rent",
    summary:
      "Corner apartments with balcony light, reserved parking, and shared lawns beside the water.",
  },
];

export function getProperty(slug: string): Property | undefined {
  return properties.find((property) => property.slug === slug);
}
