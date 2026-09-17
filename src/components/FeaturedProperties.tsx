import { HomeListingsTabs } from "@/components/HomeListingsTabs";
import { getPropertiesByType } from "@/lib/listings-store";

export async function FeaturedProperties() {
  const saleProperties = (await getPropertiesByType("sale")).slice(0, 3);
  const rentProperties = (await getPropertiesByType("rent")).slice(0, 3);

  return (
    <HomeListingsTabs
      saleProperties={saleProperties}
      rentProperties={rentProperties}
    />
  );
}
