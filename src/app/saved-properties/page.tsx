import type { Metadata } from "next";
import { InfoBody, PageHero } from "@/components/PageTemplate";

export const metadata: Metadata = {
  title: "My Saved Properties",
};

export default function SavedPropertiesPage() {
  return (
    <>
      <PageHero title="My Saved Properties" />
      <InfoBody>
        <p>Sign in to save and compare properties — account system coming soon.</p>
      </InfoBody>
    </>
  );
}
