import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        MRA Haven Estates is committed to protecting your privacy. This policy
        explains how we collect, use and store your personal information.
      </p>
      <p>Full legal content will be provided by the client.</p>
    </LegalPage>
  );
}
