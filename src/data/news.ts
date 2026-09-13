import { siteImages } from "@/data/hero-images";

export type NewsArticle = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image: string;
};

export const newsArticles: NewsArticle[] = [
  {
    slug: "uk-market-update-2026",
    title: "UK Property Market Update — Spring 2026",
    date: "12 March 2026",
    excerpt:
      "Average asking prices across the UK rose 3.2% year-on-year. Strong demand for family homes continues to outpace supply in many regions.",
    image: siteImages.news,
  },
  {
    slug: "first-time-buyer-guide",
    title: "First-Time Buyer Guide: Everything You Need to Know",
    date: "28 February 2026",
    excerpt:
      "From Help to Buy alternatives to stamp duty thresholds — our complete guide helps you navigate your first purchase with confidence.",
    image: siteImages.buy,
  },
  {
    slug: "landlord-compliance-2026",
    title: "Landlord Compliance Checklist for 2026",
    date: "15 January 2026",
    excerpt:
      "New EPC requirements and electrical inspection rules — ensure your rental property meets all legal standards before your next tenancy.",
    image: siteImages.landlords,
  },
  {
    slug: "moving-tips-stress-free",
    title: "10 Tips for a Stress-Free House Move",
    date: "5 January 2026",
    excerpt:
      "Planning, packing, and timing — expert advice from our removals team to make moving day smooth and efficient.",
    image: siteImages.removals,
  },
];
