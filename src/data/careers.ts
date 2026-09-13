export type JobListing = {
  title: string;
  location: string;
  type: string;
  description: string;
};

export const jobListings: JobListing[] = [
  {
    title: "Sales Negotiator",
    location: "Bradford, BD8",
    type: "Full-time",
    description:
      "Join our sales team helping buyers and sellers nationwide across the UK. Experience in estate agency preferred; full training provided for the right candidate.",
  },
  {
    title: "Lettings Manager",
    location: "Bradford, BD8",
    type: "Full-time",
    description:
      "Manage a portfolio of rental properties, oversee tenant find, and ensure compliance. ARLA qualification desirable.",
  },
  {
    title: "Property Marketing Coordinator",
    location: "Bradford / Hybrid",
    type: "Part-time",
    description:
      "Create stunning listings with photography coordination, portal uploads, and social media campaigns.",
  },
  {
    title: "Removal Team Driver",
    location: "Nationwide / UK",
    type: "Full-time",
    description:
      "Experienced removal driver with clean licence. Competitive pay, modern fleet, and nationwide routes.",
  },
];
