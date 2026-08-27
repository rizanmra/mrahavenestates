import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Accessibility Statement",
};

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility Statement">
      <p>
        We are committed to making our website accessible to all users. Full
        accessibility statement will be provided by the client.
      </p>
    </LegalPage>
  );
}
