import type { Metadata } from "next";
import { InfoBody, PageHero } from "@/components/PageTemplate";

export const metadata: Metadata = {
  title: "My Account",
};

export default function AccountPage() {
  return (
    <>
      <PageHero title="My Account" />
      <InfoBody cta={{ label: "Contact us", href: "/contact" }}>
        <p>Client portal for saved searches and enquiries — coming soon.</p>
      </InfoBody>
    </>
  );
}
