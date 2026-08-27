import { siteImages } from "@/data/hero-images";

export type PageContent = {
  title: string;
  subtitle?: string;
  image?: string;
  paragraphs: string[];
  bullets?: string[];
  cta?: { label: string; href: string };
};

export const pages: Record<string, PageContent> = {
  "buy/auction": {
    title: "Buy at Auction",
    subtitle: "Secure your next property at competitive auction prices.",
    image: siteImages.marketing,
    paragraphs: [
      "Property auctions offer a fast, transparent route to purchase — ideal for investors, developers, and buyers who know what they want.",
      "MRA Haven Estates works with leading auction houses across West Yorkshire. We guide you through the legal pack, guide prices, and completion timelines so there are no surprises on the day.",
    ],
    bullets: [
      "Access to residential and commercial auction lots",
      "Pre-auction viewings and due diligence support",
      "Mortgage and finance advice before you bid",
      "Conveyancing referrals for swift completion",
    ],
    cta: { label: "Register your interest", href: "/contact" },
  },
  "sell/marketing": {
    title: "Unrivalled Marketing",
    subtitle: "Your home deserves to be seen by the right buyers.",
    image: siteImages.marketing,
    paragraphs: [
      "We combine professional photography, floor plans, and cinematic video with targeted digital campaigns across Rightmove, Zoopla, and social media.",
      "Every listing receives a bespoke marketing plan tailored to your property type, price point, and local buyer profile.",
    ],
    bullets: [
      "HDR photography and drone aerials where appropriate",
      "Premium portal listings with featured placement",
      "Social media and email campaigns to our buyer database",
      "Regular feedback and viewing reports",
    ],
    cta: { label: "Book a free valuation", href: "/free-valuation" },
  },
  "sell/auction": {
    title: "Sell at Auction",
    subtitle: "A swift, certain sale when timing matters.",
    image: siteImages.marketing,
    paragraphs: [
      "Auction is ideal for probate sales, renovation projects, and properties that need a quick, unconditional sale.",
      "Our team prepares your lot with accurate guide pricing, legal packs, and maximum exposure to registered bidders.",
    ],
    bullets: [
      "Realistic guide price and reserve strategy",
      "Coordination with solicitors for legal packs",
      "National and local bidder marketing",
      "Completion typically within 28 days",
    ],
    cta: { label: "Discuss auction sale", href: "/contact" },
  },
  "rent/report-repair": {
    title: "Report a Repair",
    subtitle: "Logged, tracked, and resolved — usually within 24 hours.",
    image: siteImages.rent,
    paragraphs: [
      "Tenants can report maintenance issues online or by phone. Our property management team prioritises urgent repairs and keeps you updated at every stage.",
      "For emergencies such as gas leaks, flooding, or loss of heating, call our out-of-hours line immediately.",
    ],
    bullets: [
      "Online repair reporting with photo upload",
      "24/7 emergency line for urgent issues",
      "Vetted contractor network across Bradford",
      "Full audit trail for landlords",
    ],
    cta: { label: "Contact repairs team", href: "/contact" },
  },
  "rent/end-of-tenancy": {
    title: "End of Tenancy",
    subtitle: "A smooth handover for tenants and landlords.",
    image: siteImages.rent,
    paragraphs: [
      "When your tenancy ends, we provide clear check-out guidance, deposit return information, and forwarding address updates.",
      "Landlords receive a detailed inspection report with photographic evidence and any recommended works before re-letting.",
    ],
    bullets: [
      "Check-out inspection with inventory comparison",
      "Deposit dispute resolution via TDS",
      "Meter readings and key return checklist",
      "Re-marketing within 48 hours where agreed",
    ],
    cta: { label: "Speak to lettings", href: "/contact" },
  },
  "rent/tenant-charges": {
    title: "Tenant Charges",
    subtitle: "Transparent fees with no hidden costs.",
    image: siteImages.rent,
    paragraphs: [
      "Following the Tenant Fees Act, tenants pay only permitted charges — typically rent, deposit, and utilities. We publish all costs upfront before you sign.",
      "Holding deposits, tenancy deposits, and any optional services are explained in writing before your application proceeds.",
    ],
    bullets: [
      "Permitted payments clearly listed in your tenancy agreement",
      "Deposit protection with a government-approved scheme",
      "No admin fees for standard renewals",
      "Written confirmation before any charge is taken",
    ],
    cta: { label: "View rental properties", href: "/properties?type=rent" },
  },
  "rent/contents-insurance": {
    title: "Contents Insurance",
    subtitle: "Protect what matters while you rent.",
    image: siteImages.rent,
    paragraphs: [
      "Contents insurance covers your belongings against theft, fire, and accidental damage. While not always mandatory, we strongly recommend cover from day one of your tenancy.",
      "We can introduce you to trusted insurance partners offering competitive premiums for tenants across West Yorkshire.",
    ],
    bullets: [
      "Cover for furniture, electronics, and personal items",
      "Optional tenant liability cover",
      "Quick online quotes — cover from move-in day",
      "Claims support when you need it most",
    ],
    cta: { label: "Get a quote", href: "/contact" },
  },
  "landlords/managed": {
    title: "Fully Managed Service",
    subtitle: "Hands-off letting with complete peace of mind.",
    image: siteImages.managed,
    paragraphs: [
      "Our fully managed service covers tenant find, referencing, rent collection, maintenance, inspections, and legal compliance — so you can enjoy passive rental income without the day-to-day hassle.",
      "Dedicated property managers know your portfolio and act quickly on your behalf.",
    ],
    bullets: [
      "Tenant referencing and Right to Rent checks",
      "Rent collection and arrears management",
      "24/7 maintenance coordination",
      "Annual gas safety and electrical checks arranged",
    ],
    cta: { label: "Let your property", href: "/free-valuation" },
  },
  "landlords/marketing": {
    title: "Landlord Marketing",
    subtitle: "Let faster with premium presentation.",
    image: siteImages.marketing,
    paragraphs: [
      "Vacant periods cost money. We market your rental property with the same quality standards as our sales listings — professional photos, accurate descriptions, and instant alerts to waiting tenants.",
    ],
    bullets: [
      "Portal listings on Rightmove and Zoopla",
      "Social media promotion to local renters",
      "Accompanied viewings with feedback",
      "Pre-qualified applicants only",
    ],
    cta: { label: "Book a rental valuation", href: "/free-valuation" },
  },
  "landlords/insurance": {
    title: "Landlord Insurance",
    subtitle: "Comprehensive cover for your investment.",
    image: siteImages.landlords,
    paragraphs: [
      "Standard buildings insurance may not cover rental-specific risks. Landlord insurance can include buildings, contents, rent guarantee, and property owner liability.",
      "We work with specialist brokers to find policies suited to single lets, HMOs, and portfolios.",
    ],
    bullets: [
      "Buildings and contents options",
      "Rent guarantee and legal expenses cover",
      "Accidental damage and malicious tenant protection",
      "Portfolio discounts available",
    ],
    cta: { label: "Request insurance advice", href: "/contact" },
  },
  "landlords/rent-cover": {
    title: "Rent Cover",
    subtitle: "Protect your income if tenants cannot pay.",
    image: siteImages.landlords,
    paragraphs: [
      "Rent guarantee insurance pays your rental income if tenants default, subject to policy terms. Combined with our referencing process, it adds an extra layer of security for landlords.",
    ],
    bullets: [
      "Up to 12 months' rent cover options",
      "Legal expenses for possession proceedings",
      "Works alongside tenant referencing",
      "Peace of mind for remote landlords",
    ],
    cta: { label: "Learn more", href: "/contact" },
  },
  "landlords/charges": {
    title: "Landlord Charges",
    subtitle: "Clear, competitive fees published upfront.",
    image: siteImages.landlords,
    paragraphs: [
      "We offer tenant-find only, rent collection, and fully managed packages. All fees are agreed in writing before marketing begins — no surprises.",
    ],
    bullets: [
      "Tenant find from competitive fixed fees",
      "Rent collection with monthly statements",
      "Fully managed — percentage of monthly rent",
      "No hidden charges for standard renewals",
    ],
    cta: { label: "Request a fee schedule", href: "/contact" },
  },
  "landlords/responsibilities": {
    title: "Your Responsibilities",
    subtitle: "Stay compliant and protect your tenants.",
    image: siteImages.landlords,
    paragraphs: [
      "Landlords must meet legal obligations including gas safety certificates, electrical inspections, EPC ratings, and deposit protection. Our managed service handles compliance on your behalf.",
    ],
    bullets: [
      "Annual gas safety (CP12) certification",
      "Electrical Installation Condition Reports (EICR)",
      "Minimum EPC rating requirements",
      "Deposit protection within 30 days",
      "Right to Rent checks for all tenants",
    ],
    cta: { label: "Switch to managed lettings", href: "/landlords/managed" },
  },
  "mortgages/buy-to-let": {
    title: "Buy to Let Mortgages",
    subtitle: "Finance your investment property with expert guidance.",
    image: siteImages.mortgages,
    paragraphs: [
      "Buy-to-let mortgages differ from residential loans — lenders assess rental yield, your portfolio, and deposit size. Our mortgage partners help you find competitive rates whether you are a first-time landlord or expanding a portfolio.",
    ],
    bullets: [
      "Whole-of-market broker introductions",
      "Limited company and personal name options",
      "Remortgage and portfolio reviews",
      "Stress-tested affordability explained clearly",
    ],
    cta: { label: "Mortgage advice", href: "/mortgages" },
  },
  "about/community": {
    title: "Supporting Our Communities",
    subtitle: "Local roots, lasting impact across Bradford and beyond.",
    image: siteImages.about,
    paragraphs: [
      "MRA Haven Estates is proud to call Bradford home. We sponsor local sports clubs, support food banks, and partner with schools on career workshops for young people interested in property.",
      "Every successful move contributes to stronger neighbourhoods — and we reinvest in the communities that trust us.",
    ],
    bullets: [
      "Annual charity fundraising events",
      "Sponsorship of local youth programmes",
      "Staff volunteer days across West Yorkshire",
      "Sustainable moving — recycling packing materials",
    ],
    cta: { label: "Partner with us", href: "/contact" },
  },
};

export function getPageContent(slug: string): PageContent {
  return (
    pages[slug] ?? {
      title: "MRA Haven Estates",
      paragraphs: [
        "This page is being updated. Please contact our team for immediate assistance.",
      ],
      cta: { label: "Contact us", href: "/contact" },
    }
  );
}
