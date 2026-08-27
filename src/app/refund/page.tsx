import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy",
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy">
      <p>
        Our refund policy for services including removals and bookings. Full
        policy will be provided by the client.
      </p>
    </LegalPage>
  );
}
