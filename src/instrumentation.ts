export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

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
