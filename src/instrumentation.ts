export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    const { seedAdminAccount } = await import("@/lib/admin-server");
    const seeded = await seedAdminAccount();
    if (seeded.created) {
      console.info(`[admin] Created staff account ${seeded.email}`);
    } else if (seeded.reason && seeded.reason !== "already-exists") {
      console.warn(`[admin] Staff account seed skipped: ${seeded.reason}`);
    }
  } catch (error) {
    console.warn("[admin] Staff account seed skipped:", error);
  }

  try {
    const { syncRemovedPropertiesFromCatalogue } = await import(
      "@/lib/purge-property-saves"
    );
    const result = await syncRemovedPropertiesFromCatalogue();
    if (result.removed.length > 0) {
      console.info(
        `[shortlist] Purged removed properties from user saves: ${result.removed.join(", ")} (${result.purgedUsers} user updates)`,
      );
    }
  } catch (error) {
    console.warn("[shortlist] Catalogue sync skipped:", error);
  }
}
