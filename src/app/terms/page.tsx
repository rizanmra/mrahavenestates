import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        These terms govern your use of the MRA Haven Estates website and
        services. Full terms will be provided by the client.
      </p>
    </LegalPage>
  );
}
