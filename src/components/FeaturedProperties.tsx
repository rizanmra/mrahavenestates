import { HomeListingsTabs } from "@/components/HomeListingsTabs";
import { seedProperties } from "@/data/properties";
import { listProperties } from "@/lib/listings-store";

export async function FeaturedProperties() {
  let all = seedProperties;
  try {
    all = await listProperties();
  } catch {
    all = seedProperties;
  }
  const saleProperties = all.filter((item) => item.type === "sale").slice(0, 3);
  const rentProperties = all.filter((item) => item.type === "rent").slice(0, 3);

  return (
    <HomeListingsTabs
      saleProperties={saleProperties}
      rentProperties={rentProperties}
    />
  );
}
