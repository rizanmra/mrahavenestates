import "dotenv/config";
import {
  invalidateListingsCache,
  seedAllListings,
} from "../src/lib/listings-store";

async function main() {
  invalidateListingsCache();
  const list = await seedAllListings();
  console.log("seeded", list.length);
  console.log(list.map((item) => item.slug).join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
