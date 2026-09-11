import type { Metadata } from "next";
import { SavedPropertiesClient } from "./SavedPropertiesClient";

export const metadata: Metadata = {
  title: "My Saved Properties",
};

export default function SavedPropertiesPage() {
  return <SavedPropertiesClient />;
}
