export type NavLink = {
  label: string;
  href: string;
};

export type NavColumn = {
  title: string;
  links: NavLink[];
};

export type NavItem = {
  label: string;
  href: string;
  columns?: NavColumn[];
  highlight?: NavLink;
};

export const mainNav: NavItem[] = [
  {
    label: "Sell",
    href: "/sell",
    highlight: {
      label: "How much is my house worth?",
      href: "/property-value-calculator",
    },
    columns: [
      {
        title: "Selling Your Property",
        links: [
          { label: "Sell Your Property", href: "/sell" },
          { label: "Property Value Calculator", href: "/property-value-calculator" },
          { label: "Sell at Auction", href: "/sell/auction" },
        ],
      },
      {
        title: "Our Services",
        links: [
          { label: "Mortgages", href: "/mortgages" },
          { label: "Conveyancing", href: "/conveyancing" },
          { label: "Unrivalled Marketing", href: "/sell/marketing" },
        ],
      },
      {
        title: "Useful Information",
        links: [
          { label: "Property Value Calculator", href: "/property-value-calculator" },
          { label: "Find Your Local Branch", href: "/branches" },
          { label: "Property Insights & News", href: "/news" },
        ],
      },
    ],
  },
  {
    label: "Rent",
    href: "/rent",
    columns: [
      {
        title: "Property Search",
        links: [
          { label: "Find a Property to Rent", href: "/properties?type=rent" },
          { label: "Enquire about a Property", href: "/enquire" },
          { label: "Find Your Local Branch", href: "/branches" },
          { label: "Mortgages", href: "/mortgages" },
        ],
      },
      {
        title: "My Tenancy",
        links: [
          { label: "Report a Repair", href: "/rent/report-repair" },
          { label: "End of Tenancy", href: "/rent/end-of-tenancy" },
          { label: "Tenant Charges", href: "/rent/tenant-charges" },
        ],
      },
      {
        title: "Useful Information",
        links: [
          { label: "Area Guides", href: "/area-guides" },
          { label: "Contents Insurance", href: "/rent/contents-insurance" },
          { label: "Property Insights & News", href: "/news" },
        ],
      },
    ],
  },
  {
    label: "Landlords",
    href: "/landlords",
    highlight: {
      label: "Book Your FREE Valuation",
      href: "/free-valuation",
    },
    columns: [
      {
        title: "Letting Your Property",
        links: [
          { label: "Fully Managed Service", href: "/landlords/managed" },
          { label: "Unrivalled Marketing", href: "/landlords/marketing" },
          { label: "Let Your Property", href: "/lettings" },
        ],
      },
      {
        title: "Our Services",
        links: [
          { label: "Buy to Let Mortgages", href: "/mortgages/buy-to-let" },
          { label: "Landlord Insurance", href: "/landlords/insurance" },
          { label: "Rent Cover", href: "/landlords/rent-cover" },
        ],
      },
      {
        title: "Useful Information",
        links: [
          { label: "Landlord Charges", href: "/landlords/charges" },
          { label: "Your Responsibilities", href: "/landlords/responsibilities" },
          { label: "Property Insights & News", href: "/news" },
        ],
      },
    ],
  },
  {
    label: "Mortgages",
    href: "/mortgages",
    highlight: {
      label: "Speak to an Advisor",
      href: "/contact?reason=mortgage",
    },
    columns: [
      {
        title: "Mortgage Services",
        links: [
          { label: "Mortgage Advice", href: "/mortgages" },
          { label: "Buy to Let Mortgages", href: "/mortgages/buy-to-let" },
          { label: "Free Valuation", href: "/free-valuation" },
        ],
      },
      {
        title: "Moving home",
        links: [
          { label: "Find a Property to Rent", href: "/properties?type=rent" },
          { label: "Selling Your Property", href: "/sell" },
          { label: "Free Valuation", href: "/free-valuation" },
        ],
      },
      {
        title: "Useful Information",
        links: [
          { label: "Property Value Calculator", href: "/property-value-calculator" },
          { label: "Stamp Duty Calculator", href: "/stamp-duty" },
          { label: "Contact Us", href: "/contact?reason=mortgage" },
        ],
      },
    ],
  },
  {
    label: "Conveyancing",
    href: "/conveyancing",
    highlight: {
      label: "Get a Conveyancing Quote",
      href: "/contact?reason=conveyancing",
    },
    columns: [
      {
        title: "Conveyancing Services",
        links: [
          { label: "Conveyancing / Solicitors", href: "/conveyancing" },
          { label: "Selling Your Property", href: "/sell" },
          { label: "Lettings", href: "/lettings" },
        ],
      },
      {
        title: "Related Services",
        links: [
          { label: "Mortgages", href: "/mortgages" },
          { label: "Sell at Auction", href: "/sell/auction" },
          { label: "Find a Property to Rent", href: "/properties?type=rent" },
        ],
      },
      {
        title: "Useful Information",
        links: [
          { label: "Property Value Calculator", href: "/property-value-calculator" },
          { label: "Stamp Duty Calculator", href: "/stamp-duty" },
          { label: "Contact Us", href: "/contact?reason=conveyancing" },
        ],
      },
    ],
  },
  {
    label: "About",
    href: "/about",
    highlight: {
      label: "Book Your FREE Valuation",
      href: "/free-valuation",
    },
    columns: [
      {
        title: "Our Story",
        links: [
          { label: "Our Story", href: "/about" },
          { label: "Careers", href: "/careers" },
          { label: "Contact Us", href: "/contact?reason=general" },
        ],
      },
      {
        title: "Insights",
        links: [
          { label: "Property Insights & News", href: "/news" },
          { label: "Testimonials", href: "/about#testimonials" },
          { label: "Area Guides", href: "/area-guides" },
        ],
      },
      {
        title: "Community",
        links: [
          { label: "Supporting Our Communities", href: "/about/community" },
          { label: "Removal Services", href: "/removal-services" },
          { label: "Find Your Local Branch", href: "/branches" },
        ],
      },
    ],
  },
  { label: "News", href: "/news" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact?reason=general" },
];

export const utilityLinks = [
  { label: "My Saved Properties", href: "/saved-properties" },
  { label: "My Account", href: "/account" },
  { label: "Staff portal", href: "/admin" },
  { label: "Login", href: "/login#login-form" },
];
