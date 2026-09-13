import { HomeListingsTabs } from "@/components/HomeListingsTabs";
import { getPropertiesByType } from "@/data/properties";

export async function FeaturedProperties() {
  const saleProperties = getPropertiesByType("sale").slice(0, 3);
  const rentProperties = getPropertiesByType("rent").slice(0, 3);

  return (
    <HomeListingsTabs
      saleProperties={saleProperties}
      rentProperties={rentProperties}
    />
  );
}
