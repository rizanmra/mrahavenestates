import { siteImages } from "@/data/hero-images";

export const site = {
  name: "MRA Haven Estates",
  tagline: "Discover Your Dream Home",
  logo: "/images/brand/logo.jpg",
  phone: "0330 133 3786",
  phoneHref: "tel:03301333786",
  email: "info@mrahavenestates.co.uk",
  address: {
    line1: "Unit 3",
    line2: "5 Duncombe Street",
    city: "Bradford",
    postcode: "BD8 9AJ",
  },
  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    x: "https://x.com",
    tiktok: "https://tiktok.com",
  },
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/sales", label: "Sales" },
  { href: "/lettings", label: "Lettings" },
  { href: "/removal-services", label: "Removal Services" },
  { href: "/free-valuation", label: "Free Valuation" },
];

export const services = [
  {
    title: "Sales",
    price: "From £1",
    description:
      "Expert guidance from valuation to completion. We market your home with premium photography and targeted reach.",
    href: "/sales",
    cta: "Book Now",
    image: siteImages.sales,
  },
  {
    title: "Lettings",
    price: "From £100",
    description:
      "Landlord and tenant services across Bradford and West Yorkshire. Managed lettings with full compliance.",
    href: "/lettings",
    cta: "Book Now",
    image: siteImages.lettings,
  },
  {
    title: "Removal Services",
    price: "From £50",
    description:
      "Licensed removals with professional packing. From studio flats to full family relocations.",
    href: "/removal-services",
    cta: "Book Now",
    image: siteImages.removals,
  },
];

export const whyChooseUs = [
  "We are passionate about helping people move",
  "A dedicated team of property professionals",
  "Proud to support our local communities",
  "Complete moving solution from start to finish",
  "Sales, lettings, removals and valuations under one roof",
];

export const removalFeatures = [
  {
    title: "Our Removal Services",
    description:
      "Planning a relocation? Choosing the right removal company will help you eliminate all the hassle of moving. Our expert removal team will take care of every step in the process, from packaging your items to moving them. Our removal services are fully licensed and certified.",
  },
  {
    title: "Packing & Materials",
    description:
      "Our packing services are professional and affordable, leaving you with one less thing to worry about during your move.",
  },
  {
    title: "Removal Quote",
    description:
      "Contact us for a no obligation removal quote.",
    link: "/contact",
    linkLabel: "Removal Quote",
  },
];

export const testimonials = [
  {
    quote:
      "MRA Haven Estates made our move seamless. From the first viewing to handing over the keys, their team was professional, responsive, and genuinely cared about finding us the right home.",
    name: "Jessica Torres",
    role: "Homebuyer",
  },
  {
    quote:
      "As a landlord, I needed an agent who understood compliance and tenant care. MRA Haven delivered on every front — my properties are always well managed.",
    name: "David Mitchell",
    role: "Landlord",
  },
  {
    quote:
      "The removal team was punctual, careful with our furniture, and finished ahead of schedule. I would recommend them to anyone moving in the Bradford area.",
    name: "Sarah Ahmed",
    role: "Removal Client",
  },
];

export const heroVideo = {
  src: "https://videos.pexels.com/video-files/7578654/7578654-uhd_2560_1440_25fps.mp4",
  poster:
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85",
};

export const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/accessibility", label: "Accessibility Statement" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/refund", label: "Refund Policy" },
];
