/** Central image library — reuse across site; hero uses 3D, not slideshow */
const lib = (name: string) => `/images/library/${name}`;

export const imageLibrary = {
  heroExterior: lib("hero-luxury-exterior.png"),
  heroInterior: lib("hero-luxury-interior.png"),
  heroAerial: lib("hero-aerial-estate.png"),
  heroPenthouse: lib("hero-penthouse.png"),
  heroKitchen: lib("hero-kitchen.png"),
  aboutOffice: lib("about-office.png"),
  removals: lib("removals-service.png"),
  pageSales: lib("page-sales.png"),
  pageLettings: lib("page-lettings.png"),
  pageBuy: lib("page-buy.png"),
  pageRent: lib("page-rent.png"),
  pageLandlords: lib("page-landlords.png"),
  pageMortgages: lib("page-mortgages.png"),
  pageConveyancing: lib("page-conveyancing.png"),
  pageNews: lib("page-news.png"),
  pageCareers: lib("page-careers.png"),
  pageValuation: lib("page-valuation.png"),
  pageMarketing: lib("page-marketing.png"),
  pageManaged: lib("page-managed.png"),
};

export const heroSlides = [
  { src: imageLibrary.heroExterior, alt: "Luxury modern villa at golden hour" },
  { src: imageLibrary.heroInterior, alt: "Luxury home interior living space" },
  { src: imageLibrary.heroAerial, alt: "Aerial view of luxury estate" },
  { src: imageLibrary.heroPenthouse, alt: "Luxury penthouse with city views" },
  { src: imageLibrary.heroKitchen, alt: "Designer kitchen in luxury home" },
];

export const siteImages = {
  about: imageLibrary.aboutOffice,
  removals: imageLibrary.removals,
  sales: imageLibrary.pageSales,
  lettings: imageLibrary.pageLettings,
  buy: imageLibrary.pageBuy,
  rent: imageLibrary.pageRent,
  landlords: imageLibrary.pageLandlords,
  mortgages: imageLibrary.pageMortgages,
  conveyancing: imageLibrary.pageConveyancing,
  news: imageLibrary.pageNews,
  careers: imageLibrary.pageCareers,
  valuation: imageLibrary.pageValuation,
  community: imageLibrary.aboutOffice,
  auction: imageLibrary.pageMarketing,
  marketing: imageLibrary.pageMarketing,
  managed: imageLibrary.pageManaged,
  insurance: imageLibrary.pageLandlords,
  areaGuides: imageLibrary.heroAerial,
  heroInterior: imageLibrary.heroInterior,
  heroExterior: imageLibrary.heroExterior,
};
